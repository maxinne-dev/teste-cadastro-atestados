export function ApiTags(..._args: any[]): ClassDecorator { return () => {} }
export function ApiBearerAuth(..._args: any[]): any { return () => {} }
export function ApiBody(..._args: any[]): any { return () => {} }
export function ApiProperty(..._args: any[]): any { return () => {} }
export function ApiPropertyOptional(..._args: any[]): any { return () => {} }

class _DocumentBuilder {
  private security: any = {}
  setTitle() { return this }
  setDescription() { return this }
  setVersion() { return this }
  addBearerAuth(_opts?: any, name = 'bearer') {
    this.security[name] = { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' }
    return this
  }
  build() {
    return { components: { securitySchemes: this.security } }
  }
}

export const DocumentBuilder = _DocumentBuilder as any

export const SwaggerModule: any = {
  createDocument(_app: any, config: any) {
    const components = config?.components || { securitySchemes: { bearer: { type: 'http', scheme: 'bearer' } } }
    return { openapi: '3.0.0', components, paths: {} }
  },
  setup(..._args: any[]) {},
}
