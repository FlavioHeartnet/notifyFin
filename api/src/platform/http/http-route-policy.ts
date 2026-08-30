import { Reflector } from '@nestjs/core';

export type HttpSurface = 'administrative' | 'public';
export type AuthenticationRequirement = 'anonymous' | 'holder' | 'technical';

export interface HttpRoutePolicyDefinition {
  surface: HttpSurface;
  authentication: AuthenticationRequirement;
}

export const HttpRoutePolicy =
  Reflector.createDecorator<HttpRoutePolicyDefinition>();
