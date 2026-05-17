import type { IEmailService, SendEmailParams, SendEmailResult } from './IEmailService'

export class MockEmailService implements IEmailService {
  async send(params: SendEmailParams): Promise<SendEmailResult> {
    console.log('[MockEmailService] E-mail enviado (simulado):', {
      to: params.to,
      subject: params.subject,
    })
    return { success: true, messageId: `mock-${Date.now()}` }
  }
}
