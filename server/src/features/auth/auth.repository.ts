import { prisma } from "../../config/database";



export class AuthRepository {
    // This class will contain methods for interacting with the database for authentication-related operations.
    
    // This method finds a user by their email address in the database.
    findUserByEmail = async(email: string) => {
        // Implement the logic to find a user by email in the database.
        console.log('Finding user by email:', email);
        return prisma.user.findUnique({ where: { email } });
    }

    findUserById = async(id: string) => {
        return prisma.user.findUnique({
            where: { id },
            select: { id: true, firstName: true, lastName: true, email: true },
        });
    }

    // This method creates a new user in the database with the provided data.
    createUser = async(data: { firstName: string; lastName: string; email: string; passwordHash: string }) => {
        
        return prisma.user.create( {data} ); // Return the newly created user object (excluding the password).
    }

    // This method creates a new refresh token in the database associated with a user.
    createRefreshToken = async(data: { userId: string, tokenHash: string, expiresAt: Date }) => {

        return prisma.refreshToken.create({
            data: {
                userId: data.userId,
                tokenHash: data.tokenHash,
                expiresAt: data.expiresAt
            },
        });
    }

    // This method finds a refresh token by its hash in the database.
    findRefreshToken = async(hashedRefreshToken: string) => {
        return prisma.refreshToken.findUnique({ where: { tokenHash: hashedRefreshToken } });
    }

    
    // This method revokes a refresh token by updating its revokedAt field in the database.
    revokeRefreshToken = async (id: string) => {
    return prisma.refreshToken.update({
        where: { id },
        data: {
        revokedAt: new Date(),
    },
  });
};

    

}
