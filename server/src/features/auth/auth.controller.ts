import { Request, Response } from 'express';
import {  AuthService} from './auth.service';
import { REFRESH_TOKEN_TTL_MS } from '../../config/constants';
import { env } from '../../config/env';
import { setCsrfCookie } from '../../middleware/csrf';
import { AuthenticatedRequest } from '../../middleware/auth.middleware';

export class AuthController {
    
    constructor(private readonly authService: AuthService) {}


// Controller function for user registration
  register = async (req: Request, res: Response) => {
    
    const data = req.body; 

    // Call the authService to handle the registration logic
    const user = await this.authService.register(data);

    return res.status(201).json({
      status: 201,
      message: "User registered successfully",
      data: { user }
    });
  }
     

  // Controller function for user login
  login = async (req: Request, res: Response) => {

    const data = req.body;

    // Call the authService to handle the login logic
    const { accessToken, refreshToken, user } = await this.authService.login(data);

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: env.NODE_ENV === 'production', // Use secure cookies in production
      sameSite: env.NODE_ENV === 'production' ? 'none' : 'strict',
      maxAge: REFRESH_TOKEN_TTL_MS, // 7 days in milliseconds
    });

    // CSRF token → readable cookie
    setCsrfCookie(res);

    return res.status(200).json({
      status: 200,
      message: "Logged in successfully",
      data: { accessToken, user }
    })
  };

  // Controller function for user logout
  logout = async (req: Request, res: Response) => {

    const refreshToken = req.cookies.refreshToken;

    if (!refreshToken) {
      return res.status(200).json({
        status: 200,
        message: "User is already logged out"
      });
    }
    
    await this.authService.logout(refreshToken);
    res.clearCookie('refreshToken');

    return res.status(200).json({
      status: 200,
      message: "Logged out successfully"
    });
  };
  
  // Controller function for refreshing tokens
  refresh = async (req: Request, res: Response) => {
  const rawRefreshToken = req.cookies.refreshToken;

  const { accessToken, refreshToken } = await this.authService.refreshTokens(rawRefreshToken);

  res.cookie('refreshToken', refreshToken, {
    httpOnly: true,
    secure: env.NODE_ENV === 'production',
    sameSite: env.NODE_ENV === 'production' ? 'none' : 'strict',
    maxAge: REFRESH_TOKEN_TTL_MS,
  });

  return res.status(200).json({
    status: 200,
    message: 'Token refreshed',
    data: { accessToken },
    });
  };

  // Controller function for getting the current user
  getCurrentUser = async (req: AuthenticatedRequest , res: Response) => {
    const user =  await this.authService.getCurrentUser(req.body.id) // Assuming the user is attached to the request object by authentication middleware
    
    return res.status(200).json({
      status: 200,
      message: "Current user retrieved successfully",
      data: { user }
    });
  }
}


