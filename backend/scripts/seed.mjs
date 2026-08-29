import 'dotenv/config';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import bcrypt from 'bcryptjs';
import pg from 'pg';

const backendRoot = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const projectRoot = path.dirname(backendRoot);
const config = JSON.parse(fs.readFileSync(path.join(projectRoot, 'app.json'), 'utf8'));
const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const owners = ['Avery Morgan', 'Jordan Lee', 'Taylor Brooks', 'Morgan Chen', 'Riley Patel'];
const risks = ['Low', 'Moderate', 'High', 'Critical'];
const regions = ['Northeast', 'Southeast', 'Midwest', 'Southwest', 'West'];

function identifier(value) {
  if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(value)) throw new Error('Unsafe SQL identifier');
  return `"${value}"`;
}

function isoDate(offset) {
  const value = new Date(Date.UTC(2026, 7, 1 + offset));
  return value.toISOString().slice(0, 10);
}

function seedValue(field, index) {
  if (field.options?.length) return field.options[index % field.options.length];
  if (field.type === 'date') return isoDate(index * 3);
  if (field.type === 'number') return (index + 3) * 17;
  if (field.type === 'currency') return (index + 1) * 18750;
  if (field.type === 'textarea') return `Evidence package ${index + 1} with source validation, exception rationale, financial context, and reviewer notes.`;
  return `${field.label} ${String(index + 1).padStart(2, '0')}`;
}

async function main() {
  const client = await pool.connect();
  try {
    const existing = await client.query('SELECT COUNT(*)::int count FROM app_users');
    if (existing.rows[0].count > 0 && process.env.SEED_FORCE !== '1') {
      console.log(`Seed already present for ${config.id}; preserving PostgreSQL data`);
      return;
    }
    await client.query('BEGIN');
    const operationTables = config.operations.map(module => identifier(module.table)).join(',');
    await client.query(`TRUNCATE ${operationTables},workflow_cases,saved_analyses,audit_events,integration_state,app_users RESTART IDENTITY CASCADE`);
    const passwordHash = await bcrypt.hash(process.env.DEMO_PASSWORD || 'LocalDemo!2026', 12);
    for (const [email, name, role] of [
      ['runtime-admin@example.com', 'Runtime Administrator', 'admin'],
      ['operations-lead@example.com', 'Operations Lead', 'operator'],
      ['reviewer@example.com', 'Independent Reviewer', 'reviewer'],
    ]) await client.query('INSERT INTO app_users(email,name,role,password_hash) VALUES($1,$2,$3,$4)', [email, name, role, passwordHash]);
    for (let workflowIndex = 0; workflowIndex < config.workflows.length; workflowIndex += 1) {
      const workflow = config.workflows[workflowIndex];
      for (let index = 0; index < 15; index += 1) {
        const payload = Object.fromEntries(workflow.fields.map(field => [field.key, seedValue(field, index)]));
        await client.query('INSERT INTO workflow_cases(workflow_id,reference,subject,owner,state,risk,due_date,amount,payload) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9)', [workflow.id, `${config.id.slice(0,5).toUpperCase()}-${String(workflowIndex + 1).padStart(2,'0')}-${String(index + 1).padStart(3,'0')}`, `${workflow.title} — ${regions[index % regions.length]} case ${index + 1}`, owners[index % owners.length], ['intake','analyzing','review','approved','closed'][index % 5], risks[index % 4], isoDate(index * 3 + workflowIndex), (index + 1) * (workflowIndex + 2) * 2750, payload]);
      }
    }
    for (let moduleIndex = 0; moduleIndex < config.operations.length; moduleIndex += 1) {
      const module = config.operations[moduleIndex];
      const names = ['reference','status','owner','risk','due_date','amount',...module.columns.map(column => column.dbKey)];
      const quoted = names.map(identifier).join(',');
      const parameters = names.map((_, index) => `$${index + 1}`).join(',');
      for (let index = 0; index < 15; index += 1) {
        const values = [`OPS-${String(moduleIndex + 1).padStart(2,'0')}-${String(index + 1).padStart(3,'0')}`, ['Open','Investigating','Review','Approved','Closed'][index % 5], owners[index % owners.length], risks[index % 4], isoDate(index * 2 + moduleIndex + 4), (index + 2) * (moduleIndex + 1) * 4100, ...module.columns.map(column => seedValue(column, index))];
        await client.query(`INSERT INTO ${identifier(module.table)}(${quoted}) VALUES(${parameters})`, values);
      }
    }
    for (const integration of config.integrations) await client.query('INSERT INTO integration_state(id,name,category,mode,status) VALUES($1,$2,$3,$4,$5)', [integration.id, integration.name, integration.category, integration.mode, 'Configured']);
    for (let index = 0; index < 24; index += 1) await client.query('INSERT INTO audit_events(event_time,actor,action,object_type,object_reference,detail) VALUES($1,$2,$3,$4,$5,$6)', [new Date(Date.UTC(2026, 6, 23 + Math.floor(index / 8), 9 + index % 8, 15)), owners[index % owners.length], ['Reviewed','Assigned','Evidence attached','Status changed'][index % 4], ['AI workflow','Operational record','Control','Integration'][index % 4], `AUD-${String(index + 1).padStart(4,'0')}`, `Verified domain activity ${index + 1} with source evidence and reviewer attribution.`]);
    await client.query('COMMIT');
    console.log(`Seeded ${config.id}: 3 users, 120 workflow cases, 180 operational rows`);
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch(error => { console.error(error); process.exit(1); });
