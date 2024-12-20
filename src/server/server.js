require('dotenv').config();
const Hapi = require('@hapi/hapi');
const routes = require('../server/routes');
const loadModel = require('../services/loadModel');
const InputError = require('../exceptions/InputError');
 
(async () => {
    const server = Hapi.server({
        port: 3000,
        host: '0.0.0.0',
        routes: {
            cors: {
                origin: ['*'], 
            },
        },
    });

    const model = await loadModel();
    server.app.model = model;

    server.route(routes);

    server.ext('onPreResponse', (request, h) => {
        const response = request.response;

        if (response instanceof InputError) {
            const newResponse = h.response({
                status: 'fail',
                message: `${response.message} Silakan gunakan foto lain.`,
            });
            newResponse.code(response.statusCode);
            return newResponse;
        }

        if (response.isBoom) {
            const { output } = response;
            const newResponse = h.response({
                status: 'fail',
                message: output.payload.message || 'Terjadi kesalahan saat memproses permintaan.',
            });
            newResponse.code(output.statusCode);
            return newResponse;
        }

        if (response.isServer) {
            const newResponse = h.response({
                status: 'fail',
                message: 'Terjadi kesalahan internal pada server.',
            });
            newResponse.code(500);  
            return newResponse;
        }

        return h.continue;
    });

    await server.start();
    console.log(`Server start at: ${server.info.uri}`);
})();
