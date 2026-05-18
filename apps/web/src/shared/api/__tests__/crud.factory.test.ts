import { describe, expect, it } from 'vitest'
import { customer1, customersList } from '@/test/fixtures/customers.fixtures'
import { createCrudApi } from '../crud.factory'

const customersApi = createCrudApi<(typeof customer1) & { id: string }>('/customers')

describe('createCrudApi', () => {
  it('getAll() faz GET no endpoint e retorna array', async () => {
    const result = await customersApi.getAll()
    expect(result).toEqual(customersList)
  })

  it('getOne(id) faz GET em /{endpoint}/{id}', async () => {
    const result = await customersApi.getOne('cust-1')
    expect(result).toEqual(customer1)
  })

  it('create(data) faz POST e retorna o item criado', async () => {
    const newData = { name: 'Novo Cliente', cnpj: '11222333000181', email: 'novo@test.com', phone: '11999990099' }
    const result = await customersApi.create(newData)
    expect(result).toMatchObject({ name: 'Novo Cliente' })
  })

  it('update(id, data) faz PATCH em /{endpoint}/{id}', async () => {
    const updateData = { name: 'Nome Atualizado' }
    const result = await customersApi.update('cust-1', updateData)
    expect(result).toMatchObject({ name: 'Nome Atualizado' })
  })

  it('remove(id) faz DELETE em /{endpoint}/{id}', async () => {
    await expect(customersApi.remove('cust-1')).resolves.not.toThrow()
  })
})
