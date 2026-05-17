import { Button } from '../atoms/Button'

export function HeroSection() {
  return (
    <section className="flex flex-col items-center gap-6 px-6 py-20 text-center">
      <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-6xl">
        Rastreamento veicular
        <br />
        <span className="text-blue-600">simples e eficiente</span>
      </h1>
      <p className="max-w-xl text-lg text-gray-600">
        Gerencie sua frota, clientes e rastreadores em um único lugar. Controle total, em tempo real.
      </p>
      <div className="flex flex-col gap-3 sm:flex-row">
        <Button size="lg">Começar gratuitamente</Button>
        <Button size="lg" variant="outline">
          Ver demonstração
        </Button>
      </div>
    </section>
  )
}
