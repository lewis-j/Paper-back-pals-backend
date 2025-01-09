import { IsString, IsOptional, IsEnum } from 'class-validator';

export class UpdateUserProfileDto {
  @IsOptional()
  @IsString()
  bio?: string;

  @IsOptional()
  @IsString()
  location?: string;

  @IsOptional()
  @IsEnum(['public', 'private']) // if you have specific visibility options
  visibility?: string;

  @IsOptional()
  @IsString()
  username?: string;

  @IsOptional()
  @IsString()
  currentRead?: string;
}
