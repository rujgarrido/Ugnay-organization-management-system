import { generateRefreshToken, hashRefreshToken, generateAccessToken } from '../../lib/jwt.util';
import { AppError } from '../../middleware/errorHandler';
import { prisma } from '../../config/database';
import { listUserMemberships } from '../organizations/memberships';
import bcrypt from 'bcrypt';
import { REFRESH_TOKEN_TTL_MS } from '../../config/constants';

// Per docs/architecture.md there is NO repository layer — the service talks
// to Prisma directly (FLAG-4 fix: the old auth.repository.ts was removed).
// Membership data is resolved through the organizations module's exported
// helper, the one sanctioned cross-module capability.
export class AuthService {
    register = async (data: { firstName: string; lastName: string; email: string; password: string; confirmPassword: string }) => {
        // check if the user already exists
        const existingUser = await prisma.user.findUnique({ where: { email: data.email } });
        if (existingUser) {
            throw new AppError('User already exists', 409);
        }

        const hashedPassword = await bcrypt.hash(data.password, 10);

        const newUser = await prisma.user.create({
            data: {
                firstName: data.firstName,
                lastName: data.lastName,
                email: data.email,
                passwordHash: hashedPassword,
            },
        });

        // New users have no organizations yet — return the shape the frontend
        // expects (User.memberships) directly.
        return {
            id: newUser.id,
            firstName: newUser.firstName,
            lastName: newUser.lastName,
            email: newUser.email,
            memberships: [],
        };
    };

    login = async (data: { email: string; password: string }) => {
        const existingUser = await prisma.user.findUnique({ where: { email: data.email } });
        if (!existingUser) {
            throw new AppError('Invalid email or password', 401);
        }

        const isPasswordValid = await bcrypt.compare(data.password, existingUser.passwordHash);
        if (!isPasswordValid) {
            throw new AppError('Invalid email or password', 401);
        }

        const accessToken = generateAccessToken({ id: existingUser.id });
        const refreshToken = generateRefreshToken();
        const hashedRefreshToken = hashRefreshToken(refreshToken);

        const expiresAt = new Date(Date.now() + REFRESH_TOKEN_TTL_MS);

        await prisma.refreshToken.create({
            data: {
                userId: existingUser.id,
                tokenHash: hashedRefreshToken,
                expiresAt,
            },
        });

        // Memberships ride along so the frontend can resolve the active org
        // without an extra request right after login.
        const memberships = await listUserMemberships(existingUser.id);

        return {
            accessToken,
            refreshToken,
            user: {
                id: existingUser.id,
                firstName: existingUser.firstName,
                lastName: existingUser.lastName,
                email: existingUser.email,
                memberships,
            },
        };
    };

    logout = async (refreshToken: string) => {
        const hashedRefreshToken = hashRefreshToken(refreshToken);
        const refreshTokenRecord = await prisma.refreshToken.findUnique({
            where: { tokenHash: hashedRefreshToken },
        });

        if (!refreshTokenRecord) {
            throw new AppError('Invalid refresh token', 401);
        }

        if (refreshTokenRecord.revokedAt) {
            return;
        }

        await prisma.refreshToken.update({
            where: { id: refreshTokenRecord.id },
            data: { revokedAt: new Date() },
        });
    };

    // Validates the provided refresh token, revokes it (rotation), and issues
    // a new pair plus the session user so the frontend can bootstrap.
    refreshTokens = async (rawRefreshToken: string) => {
        if (!rawRefreshToken) {
            throw new AppError('Refresh token is required', 400);
        }

        const hashedRefreshToken = hashRefreshToken(rawRefreshToken);
        const existingToken = await prisma.refreshToken.findUnique({
            where: { tokenHash: hashedRefreshToken },
        });

        if (!existingToken) {
            throw new AppError('Invalid refresh token', 401);
        }

        if (existingToken.revokedAt) {
            throw new AppError('Invalid refresh token', 401);
        }

        if (existingToken.expiresAt < new Date()) {
            throw new AppError('Invalid refresh token', 401);
        }

        // Rotation: the token just used is now dead, permanently.
        await prisma.refreshToken.update({
            where: { id: existingToken.id },
            data: { revokedAt: new Date() },
        });

        const newAccessToken = generateAccessToken({ id: existingToken.userId });
        const newRawRefreshToken = generateRefreshToken();
        const newHashedRefreshToken = hashRefreshToken(newRawRefreshToken);

        const expiresAt = new Date(Date.now() + REFRESH_TOKEN_TTL_MS);
        await prisma.refreshToken.create({
            data: {
                userId: existingToken.userId,
                tokenHash: newHashedRefreshToken,
                expiresAt,
            },
        });

        const user = await prisma.user.findUnique({
            where: { id: existingToken.userId },
            select: { id: true, firstName: true, lastName: true, email: true },
        });
        if (!user) {
            throw new AppError('User not found', 404);
        }

        const memberships = await listUserMemberships(existingToken.userId);

        return {
            accessToken: newAccessToken,
            refreshToken: newRawRefreshToken,
            user: { ...user, memberships },
        };
    };

    getCurrentUser = async (userId: string) => {
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { id: true, firstName: true, lastName: true, email: true },
        });

        if (!user) {
            throw new AppError('User not found', 404);
        }

        const memberships = await listUserMemberships(userId);

        return { ...user, memberships };
    };
}