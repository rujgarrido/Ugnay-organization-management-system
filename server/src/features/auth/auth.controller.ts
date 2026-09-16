import type { Request, Response } from 'express';
import { AuthService } from './auth.service';
import { REFRESH_TOKEN_TTL_MS } from '../../config/constants';
import { env } from '../../config/env';
import { issueCsrfToken, setCsrfCookie } from '../../middleware/csrf';
import { AppError } from '../../middleware/errorHandler';
import { AuthenticatedRequest } from '../../middleware/auth.middleware';

export class AuthController {

    constructor(private readonly authService: AuthService) {}

    // Issues a fresh CSRF cookie on a safe method so the frontend can
    // bootstrap (read csrfToken cookie -> attach X-CSRF-Token header).
    issueCsrf = async (req: Request, res: Response) => {
        const csrfToken = issueCsrfToken(res);

        return res.status(200).json({
            status: 200,
            message: 'CSRF token issued',
            data: { csrfToken },
        });
    };

    register = async (req: Request, res: Response) => {
        const user = await this.authService.register(req.body);

        return res.status(201).json({
            status: 201,
            message: 'User registered successfully',
            data: { user },
        });
    };

    login = async (req: Request, res: Response) => {
        const { accessToken, refreshToken, user } = await this.authService.login(req.body);

        res.cookie('refreshToken', refreshToken, {
            httpOnly: true,
            secure: env.NODE_ENV === 'production',
            sameSite: env.NODE_ENV === 'production' ? 'none' : 'strict',
            maxAge: REFRESH_TOKEN_TTL_MS,
        });

        // CSRF token -> readable cookie (double-submit pattern)
        setCsrfCookie(res);

        return res.status(200).json({
            status: 200,
            message: 'Logged in successfully',
            data: { accessToken, user },
        });
    };

    logout = async (req: Request, res: Response) => {
        const refreshToken = req.cookies.refreshToken;

        if (!refreshToken) {
            return res.status(200).json({
                status: 200,
                message: 'User is already logged out',
            });
        }

        await this.authService.logout(refreshToken);
        res.clearCookie('refreshToken');

        return res.status(200).json({
            status: 200,
            message: 'Logged out successfully',
        });
    };

    refresh = async (req: Request, res: Response) => {
        const rawRefreshToken = req.cookies.refreshToken;

        const { accessToken, refreshToken, user } = await this.authService.refreshTokens(rawRefreshToken);

        res.cookie('refreshToken', refreshToken, {
            httpOnly: true,
            secure: env.NODE_ENV === 'production',
            sameSite: env.NODE_ENV === 'production' ? 'none' : 'strict',
            maxAge: REFRESH_TOKEN_TTL_MS,
        });

        // user (with memberships) rides along so the frontend can restore the
        // session and resolve the active organization on a cold page load.
        return res.status(200).json({
            status: 200,
            message: 'Token refreshed',
            data: { accessToken, user },
        });
    };

    // FIX (FLAG-3): reads the authenticated id from req.user — the previous
    // code read req.body.id, which is never set on a GET request.
    getCurrentUser = async (req: AuthenticatedRequest, res: Response) => {
        if (!req.user?.id) {
            throw new AppError('Authentication required', 401);
        }

        const user = await this.authService.getCurrentUser(req.user.id);

        return res.status(200).json({
            status: 200,
            message: 'Current user retrieved successfully',
            data: { user },
        });
    };
}