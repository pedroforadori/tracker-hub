import type { IEmailService, SendEmailParams, SendEmailResult } from './IEmailService'

// TODO: npm install resend
// TODO: adicionar RESEND_API_KEY ao .env
export class ResendEmailService implements IEmailService {
  // private resend: Resend

  constructor() {
    // this.resend = new Resend(process.env.RESEND_API_KEY)
  }

  async send(params: SendEmailParams): Promise<SendEmailResult> {
    try {
      // const { data, error } = await this.resend.emails.send({
      //   from: 'noreply@trackerhub.com.br',
      //   to: params.to,
      //   subject: params.subject,
      //   html: params.html,
      //   replyTo: params.replyTo,
      // })
      // if (error) return { success: false, error: error.message }
      // return { success: true, messageId: data?.id }
      throw new Error('ResendEmailService não configurado. Adicione RESEND_API_KEY ao .env')
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : 'Erro desconhecido' }
    }
  }
}
