import { Body, Controller, Delete, Get, Param, Patch, Post, Request } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';
import { CustomersService } from './customers.service';

@ApiTags('Clientes')
@ApiBearerAuth()
@Controller('customers')
export class CustomersController {
  constructor(private readonly service: CustomersService) {}

  @Get()
  @ApiOperation({ summary: 'Listar clientes do tenant' })
  findAll(@Request() req: { user: { tenantId: string } }) {
    return this.service.findAll(req.user);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Buscar cliente por ID' })
  findOne(@Param('id') id: string, @Request() req: { user: { tenantId: string } }) {
    return this.service.findOne(id, req.user);
  }

  @Post()
  @ApiOperation({ summary: 'Cadastrar novo cliente' })
  create(@Body() dto: CreateCustomerDto, @Request() req: { user: { tenantId: string } }) {
    return this.service.create(dto, req.user);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Atualizar cliente' })
  update(@Param('id') id: string, @Body() dto: UpdateCustomerDto, @Request() req: { user: { tenantId: string } }) {
    return this.service.update(id, dto, req.user);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Remover cliente' })
  remove(@Param('id') id: string, @Request() req: { user: { tenantId: string } }) {
    return this.service.remove(id, req.user);
  }
}
