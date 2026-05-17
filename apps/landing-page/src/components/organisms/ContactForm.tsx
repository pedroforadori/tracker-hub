'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { Button } from '../atoms/Button'
import { Input } from '../atoms/Input'
import { FormField } from '../molecules/FormField'

const contactSchema = z.object({
  name: z.string().min(2, 'Mínimo 2 caracteres'),
  email: z.string().email('E-mail inválido'),
  message: z.string().min(10, 'Mínimo 10 caracteres'),
})

type ContactFormData = z.infer<typeof contactSchema>

export function ContactForm() {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting, isSubmitSuccessful },
    reset,
  } = useForm<ContactFormData>({ resolver: zodResolver(contactSchema) })

  const onSubmit = async (data: ContactFormData) => {
    await fetch('/api/contact', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    reset()
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4" noValidate>
      {isSubmitSuccessful && (
        <p role="status" className="rounded-md bg-green-50 p-3 text-sm text-green-700">
          Mensagem enviada com sucesso!
        </p>
      )}

      <FormField label="Nome" htmlFor="name" error={errors.name?.message} required>
        <Input id="name" {...register('name')} error={!!errors.name} placeholder="Seu nome" />
      </FormField>

      <FormField label="E-mail" htmlFor="email" error={errors.email?.message} required>
        <Input id="email" type="email" {...register('email')} error={!!errors.email} placeholder="seu@email.com" />
      </FormField>

      <FormField label="Mensagem" htmlFor="message" error={errors.message?.message} required>
        <textarea
          id="message"
          {...register('message')}
          rows={4}
          placeholder="Como podemos ajudar?"
          className={`w-full rounded-md border px-3 py-2 text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.message ? 'border-red-500' : 'border-gray-300'}`}
        />
      </FormField>

      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting ? 'Enviando...' : 'Enviar mensagem'}
      </Button>
    </form>
  )
}
