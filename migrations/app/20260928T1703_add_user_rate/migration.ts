#!/usr/bin/env -S node
import type { Contract as End } from '../../snapshots/1868e83ef8dbf9b4ed9e6f3e91ec86ac17de802f912b8a4662143779a4cb64ec/contract';
import endContractJson from '../../snapshots/1868e83ef8dbf9b4ed9e6f3e91ec86ac17de802f912b8a4662143779a4cb64ec/contract.json' with { type: 'json' };
import type { Contract as Start } from '../../snapshots/91e7f9f035806fa2789a4d726ef7724cad434fd6b00014d47ebf12d6e6bb784e/contract';
import startContract from '../../snapshots/91e7f9f035806fa2789a4d726ef7724cad434fd6b00014d47ebf12d6e6bb784e/contract.json' with { type: 'json' };
import { Migration, MigrationCLI, col, placeholder } from '@prisma/orm-postgres/migration';

import postgresAdapter from '@prisma/orm-postgres/adapter/runtime';
import { sql } from '@prisma/orm-postgres/builder/runtime';
import { createExecutionContext, createSqlExecutionStack } from '@prisma/orm-postgres/family-runtime';
import postgresTarget, { PostgresContractSerializer } from '@prisma/orm-postgres/target/runtime';

const endContract = new PostgresContractSerializer().deserializeContract<End>(endContractJson);
const stack = createSqlExecutionStack({ target: postgresTarget, adapter: postgresAdapter });

const db = sql<End>({
  context: createExecutionContext({ contract: endContract, stack }),
  rawCodecInferer: stack.adapter.rawCodecInferer,
});

export default class M extends Migration<Start, End> {
  override readonly startContractJson = startContract;
  override readonly endContractJson = endContract;

  override get operations() {
    return [
      this.addColumn({
        schema: 'public',
        table: 'User',
        column: col('hourlyRate', 'float8', { codecRef: { codecId: 'pg/float8@1' } }),
      }),
      this.dataTransform(endContract, 'backfill-User-hourlyRate', {
        check: () =>
          db.public.User
            .select('id')
            .where((f, fns) => fns.eq(f.hourlyRate, null))
            .limit(1),
        run: () => 
          db.public.User
          .update({ hourlyRate: 25 })
          .where((f, fns) => fns.eq(f.hourlyRate, null)),
      }),
      this.setNotNull({ schema: 'public', table: 'User', column: 'hourlyRate' }),
    ];
  }
}

MigrationCLI.run(import.meta.url, M);
