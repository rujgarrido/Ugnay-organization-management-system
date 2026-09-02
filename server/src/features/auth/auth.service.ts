
import { generateRefreshToken, hashRefreshToken, generateAccessToken } from '../../lib/jwt.util';
import { AppError } from '../../middleware/errorHandler';
import { AuthRepository } from './auth.repository';
import bcrypt from 'bcrypt';
import { REFRESH_TOKEN_TTL_MS } from '../../config/constants';

export class AuthService {

    constructor (private readonly authRepository: AuthRepository){}

     register = async(data: { firstName: string; lastName: string; email: string; password: string , confirmPassword: string }) => {

        
        // check if the user already exists
        const existingUser = await this.authRepository.findUserByEmail(data.email);
        if (existingUser) {
            throw new AppError("User already exists",409);
        }
        
        const hashedPassword = await bcrypt.hash(data.password, 10); 

        // Proceed with user registration
        const newUser = await this.authRepository.createUser({ 
            firstName: data.firstName,
            lastName: data.lastName,
            email: data.email,
            passwordHash: hashedPassword
         });

            const user = {
            id: newUser.id,
            firstName:newUser.firstName,
            lastName: newUser.lastName,
            email: newUser.email,}; // Return the newly created user object (excluding the password).

             return user;
    }

    login = async(data: { email: string; password: string }) => {

        // check if the user exists
        const existingUser = await this.authRepository.findUserByEmail(data.email);
        if (!existingUser) {
            throw new AppError("Invalid email or password",401);
        }

        // Compare the provided password with the stored hashed password
        const isPasswordValid = await bcrypt.compare(data.password, existingUser.passwordHash);
        if (!isPasswordValid) {
            throw new AppError("Invalid email or password",401);
        }

        // If login is successful, you can return user details or a access token and refresh token
        const payload = {id:existingUser.id};

        // Generate access token a
        const accessToken = generateAccessToken(payload);
        // Generate refresh token
        const refreshtoken =  generateRefreshToken();
        // Hash the refresh token before storing it in the database
        const hashedRefreshToken = hashRefreshToken(refreshtoken);

        // Store the hashed refresh token in the database with an expiration date (7 days from now)
        const expiresAt = new Date(Date.now() + REFRESH_TOKEN_TTL_MS);

        await this.authRepository.createRefreshToken({
            userId: payload.id,
            tokenHash: hashedRefreshToken,
            expiresAt: expiresAt,
        });
        
        return {
            accessToken,
            refreshToken: refreshtoken,
            user: {
                id: existingUser.id,
                firstName: existingUser.firstName,
                lastName: existingUser.lastName,
                email: existingUser.email,
            },
        };
    }

    logout = async (refreshToken: string) => {
        
        // Hash the provided refresh token to find it in the database
        const hashedRefreshToken = hashRefreshToken(refreshToken);
        const refreshTokenRecord = await this.authRepository.findRefreshToken(hashedRefreshToken);

         if (!refreshTokenRecord) {
            throw new AppError('Invalid refresh token',401);
        }

         if (refreshTokenRecord.revokedAt) {
            return;
        }

        await this.authRepository.revokeRefreshToken(
            refreshTokenRecord.id
        );
    }
    
    // This method handles the refresh token logic every time a user requests a new access token using a refresh token. 
    // It validates the provided refresh token, revokes it, and generates new access and refresh tokens.
    refreshTokens = async (rawRefreshToken: string) => {

        if (!rawRefreshToken) {
            throw new AppError('Refresh token is required', 400);
        }

        // Hash the provided refresh token to find it in the database
        const hashedRefreshToken = hashRefreshToken(rawRefreshToken);
        const existingToken = await this.authRepository.findRefreshToken(hashedRefreshToken);

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
        await this.authRepository.revokeRefreshToken(existingToken.id);

        const payload = { id: existingToken.userId };
        // Generate new access token 
        const newAccessToken = generateAccessToken(payload);
        // Generate a new refresh token
        const newRawRefreshToken = generateRefreshToken();
        const newHashedRefreshToken = hashRefreshToken(newRawRefreshToken);

        const expiresAt = new Date(Date.now() + REFRESH_TOKEN_TTL_MS);
        // Store the new hashed refresh token in the database with an expiration date (7 days from now)
        await this.authRepository.createRefreshToken({
            userId: payload.id,
            tokenHash: newHashedRefreshToken,
            expiresAt: expiresAt,
        });

        const user = await this.authRepository.findUserById(payload.id);
        if (!user) {
            throw new AppError('User not found', 404);
        }

        return { accessToken: newAccessToken, refreshToken: newRawRefreshToken, user };

    }
}
