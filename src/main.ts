import express, {Response, Request} from 'express';
import path, {dirname} from 'path';
import * as http from "node:http";
import pg, {ClientConfig} from 'pg'
import * as fs from "node:fs";
import {fileURLToPath} from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const {Client} = pg;

class httpServer {
    public app: express.Application;
    private readonly port: number = 3000;
    private dbClient: pg.Client | undefined = undefined;

    constructor() {
        this.app = express();
        this.app.use(express.json());
        this.app.use(express.static(path.join(__dirname, '..')));
        this.app.use(express.static(path.join(__dirname, '..', 'static')));
        this.app.use(express.static('public', {
            setHeaders: (res, path) => {
                if (path.endsWith('.js')) {
                    res.set('Content-Type', 'application/javascript');
                }
            }
        }));

        this.port = 3000;

        http.createServer(this.app).listen(this.port, () => {
            console.log(`Server started on port ${this.port}.\n http://localhost:${this.port}`);
        });
    }

    public async dbConnect(config: ClientConfig) {
        try {
            this.dbClient = new Client(config);
            await this.dbClient.connect();
        } catch (e) {
            console.error(e);
        }
    }

    public async dbExecute(sql: string, commit: boolean, values?: string[]): Promise<pg.QueryResult> {
        if (this.dbClient) {
            try {
                await this.dbClient.query('BEGIN');
                const result = this.dbClient.query(sql, values);
                if (commit) {
                    await this.dbClient.query('COMMIT');
                }
                return result;
            } catch (e) {
                await this.dbClient.query('ROLLBACK');
                console.error(e);
            }
        }
        throw new Error('Not connected to DB');
    }
}

try {
    const server = new httpServer();
    const config = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'pg.json')).toString());
    await server.dbConnect(config);

    server.app.get('/', (req, res) => {
        res.sendFile(path.resolve('static/html/index.html'));
    });

    server.app.get('/allVoyages', async (req, res) => {
        try {
            const sql = 'SELECT public.voyage.id, public.destination.value as destination, public.auto.value as auto, '
                + 'cargos, type FROM public.voyage '
                + 'JOIN public.destination ON public.voyage.destination = public.destination.id '
                + 'JOIN public.auto ON public.voyage.auto = public.auto.id ';
            const queryResult = await server.dbExecute(sql, true);
            res.status(200).send(queryResult.rows);
        } catch (e) {
            console.error(e);
            res.status(400).send(e);
        }
    });

    server.app.get('/destination', async (req, res) => {
        try {
            const {id} = req.query;
            const sql = `SELECT * FROM public.destination `
                + (id ? `WHERE id = '${id}'` : '')
            const queryResult = await server.dbExecute(sql, true);
            res.status(200).send(queryResult.rows);
        } catch (e) {
            console.error(e);
            res.status(400).send(e);
        }
    });

    server.app.put('/destination', async (req, res) => {
        try {
            const body = req.body;
            if (Object.keys(body).length === 0) {
                throw new Error('Empty body');
            }
            const sql = `INSERT INTO public.destination (id, value) `
                + `VALUES ('${body.id}', '${body.value}')`
            await server.dbExecute(sql, true);
            res.status(200).send();
        } catch (e) {
            console.error(e);
            res.status(400).send(e);
        }
    });

    server.app.get('/auto', async (req, res) => {
        try {
            const {id} = req.query;
            const sql = `SELECT * FROM public.auto `
                + (id ? `WHERE id = '${id}'` : '')
            const queryResult = await server.dbExecute(sql, true);
            res.status(200).send(queryResult.rows);
        } catch (e) {
            console.error(e);
            res.status(400).send(e);
        }
    });

    server.app.post('/voyage', async (req, res) => {
        try {
            const {id, cargoId} = req.query;
            if (!id) {
                throw new Error('Empty id');
            }
            const body = req.body;
            if (Object.keys(body).length === 0) {
                throw new Error('Empty body');
            }
            let sql: string;
            if (cargoId) {
                const cargo = body.cargo;
                if (cargo.remove) {
                    sql = `DELETE FROM public.cargo WHERE id = '${cargoId}'`;
                } else {
                    sql = `INSERT INTO public.cargo (id, name, size) `
                        + `VALUES ('${cargo.id}', '${cargo.name}', ${cargo.size})`;
                }
                await server.dbExecute(sql, false);
            }
            const set =
                [(body.itemId
                    ? (body.remove
                        ? `cargos = array_remove(cargos, '${body.itemId}')`
                        : `cargos = array_append(cargos, '${body.itemId}')`)
                    : '')
                , (body.destination
                    ? `destination = '${body.destination}'`
                    : '')
                , (body.auto
                    ? `auto = '${body.auto}'`
                    : '')]
            sql = `UPDATE public.voyage `
                + `SET `
                + set.filter(value => value.length > 0).join(', ') + ' '
                +`WHERE id = '${id}' `
                + (body.itemId
                    ? (body.remove
                        ? `AND '${body.itemId}' = ANY(cargos)`
                        : `AND '${body.itemId}' != ALL(cargos)`)
                    : '')
            await server.dbExecute(sql, true);
            res.status(200).send();
        } catch (e) {
            console.error(e);
            res.status(400).send(e);
        }
    });

    server.app.put('/voyage', async (req, res) => {
        try {
            const body = req.body;
            if (Object.keys(body).length === 0) {
                throw new Error('Empty body');
            }
            const sql = `INSERT INTO public.voyage (id, destination, auto) `
                + `VALUES ('${body.id}', '${body.destination}', '${body.auto}')`
            await server.dbExecute(sql, true);
            res.status(200).send();
        } catch (e) {
            console.error(e);
            res.status(400).send(e);
        }
    });

    server.app.delete('/voyage', async (req, res) => {
        try {
            const {id} = req.query;
            if (!id) {
                throw new Error('Empty id');
            }
            let sql = 'SELECT cargos FROM public.voyage;'
            const cargos: string[] = (await server.dbExecute(sql, true)).rows[0].cargos;
            if (cargos.length > 0) {
                sql = `DELETE FROM public.cargo `
                    + `WHERE id IN (${cargos.map(cargo => `'${cargo}'`).join(', ')})`;
                await server.dbExecute(sql, false);
            }
            sql = `DELETE FROM public.voyage `
                + `WHERE id = '${id}'`
            await server.dbExecute(sql, true);
            res.status(200).send();
        } catch (e) {
            console.error(e);
            res.status(400).send(e);
        }
    });

    server.app.get('/cargo', async (req, res) => {
        try {
            const {id} = req.query;
            const sql = `SELECT * FROM public.cargo `
                + (id
                    ? `WHERE id = '${id}' `
                    : '');
            const queryResult = await server.dbExecute(sql, true);
            res.status(200).send(queryResult.rows);
        } catch (e) {
            console.error(e);
            res.status(400).send(e);
        }
    });

    async function postCargo(req: Request, res: Response) {
        try {
            const {id} = req.query;
            if (!id) {
                throw new Error('Empty id');
            }
            const body = req.body;
            if (Object.keys(body).length === 0) {
                throw new Error('Empty body');
            }
            const set = [(body.name
                ? `name = '${body.name}' `
                : '')
            , (body.size
                ? `size = '${body.size}'`
                : '')];
            const sql = 'UPDATE public.cargo '
                + 'SET '
                + set.filter(value => value.length > 0).join(', ') + ' '
                + `WHERE id = '${id}'`
            console.log(sql);
            await server.dbExecute(sql, true);
            res.status(200).send();
        } catch (e) {
            console.error(e);
            res.status(400).send(e);
        }
    }

    server.app.post('/cargo', postCargo);

    async function putCargo(req: Request, res: Response) {
        try {
            const body = req.body;
            if (Object.keys(body).length === 0) {
                throw new Error('Empty body');
            }
            const sql = `INSERT INTO public.cargo (id, name, size) `
                + `VALUES ('${body.id}', '${body.name}', '${body.size}')`;
            await server.dbExecute(sql, true);
            res.status(200).send();
        } catch (e) {
            console.error(e);
            res.status(400).send(e);
        }
    }

    server.app.put('/cargo', putCargo);

    server.app.delete('/cargo', async (req, res) => {
        try {
            const {id} = req.query;
            if (!id) {
                throw new Error('Empty id');
            }
            const sql = `DELETE FROM public.cargo WHERE id = '${id}'`;
            await server.dbExecute(sql, true);
            res.status(200).send();
        } catch (e) {
            console.error(e);
            res.status(400).send(e);
        }
    });

} catch (e) {
    console.error(e);
}
