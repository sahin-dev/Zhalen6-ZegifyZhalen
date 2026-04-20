import { Module } from "@nestjs/common";
import { JwtModule } from "@nestjs/jwt";
import { ConfigModule } from "@nestjs/config";
import { AuthService } from "./auth.service";
import { AuthController } from "./auth.controller";
import { PrismaModule } from "src/prisma/prisma.module";
import jwtConfig from "src/config/jwt.config";
import { SmtpProvider } from "src/common/providers/smtp.provider";

@Module({
    imports:[
        JwtModule.register({}),
        ConfigModule.forFeature(jwtConfig),
        PrismaModule,
    ],
    providers:[AuthService, SmtpProvider],
    controllers:[AuthController]
})
export class AuthModule {

}