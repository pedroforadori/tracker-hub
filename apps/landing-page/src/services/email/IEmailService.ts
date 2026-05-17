export interface SendEmailParams {
  to: string
  subject: string
  html: string
  replyTo?: string
}

export interface SendEmailResult {
  success: boolean
  messageId?: string
  error?: string
}

export interface IEmailService {
  send(params: SendEmailParams): Promise<SendEmailResult>
}
