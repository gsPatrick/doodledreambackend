const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
require('dotenv').config();

const { sequelize } = require("./config/database");
const tratarErros = require("./middleware/tratarErros");
const swaggerUi = require('swagger-ui-express');
const path = require("path");

// Importar todas as suas rotas
const authRoutes = require("./routes/authRoutes");
const produtoRoutes = require("./routes/produtoRoutes");
const pedidoRoutes = require("./routes/pedidoRoutes");
const carrinhoRoutes = require("./routes/carrinhoRoutes");
const cupomRoutes = require("./routes/cupomRoutes");
const blogRoutes = require("./routes/blogRoutes");
const downloadRoutes = require("./routes/downloadRoutes");
const freteRoutes = require("./routes/freteRoutes");
const usuarioRoutes = require("./routes/usuarioRoutes");
const categoriaRoutes = require("./routes/categoriaRoutes");
const enderecoRoutes = require("./routes/enderecoRoutes");
const avaliacaoRoutes = require("./routes/avaliacaoRoutes");
const pagamentoRoutes = require("./routes/pagamentoRoutes");
const uploadRoutes = require("./routes/uploadRoutes");
const favoritoRoutes = require("./routes/favoritoRoutes");
const dashboardRoutes = require("./routes/dashboardRoutes");
const configuracaoLojaRoutes = require("./routes/configuracaoLojaRoutes");
const viaCepRoutes = require("./routes/viaCepRoutes");
const relatorioRoutes = require("./routes/relatorioRoutes");
const subscriptionRoutes = require("./routes/subscriptionRoutes");

const app = express();

// --- LOGGING MIDDLEWARE ---
// Adicionado no topo para logar cada requisição recebida.
// Isso é útil para depurar problemas de CORS e 502.
app.use((req, res, next) => {
  console.log(`[INCOMING REQUEST] Method: ${req.method}, URL: ${req.originalUrl}, Origin: ${req.headers.origin}`);
  next();
});

// --- CONFIGURAÇÃO DE CORS ROBUSTA ---
const allowedOrigins = [
  'http://localhost:5173', // Frontend em desenvolvimento
  'http://localhost:3000', // Outra porta comum
  'https://doodledreams.jvitor.tech' // ADICIONE A URL DO SEU FRONTEND EM PRODUÇÃO AQUI
];

const corsOptions = {
  origin: (origin, callback) => {
    // Permite requisições sem 'origin' (ex: Postman) ou se a origem estiver na lista branca.
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.error(`[CORS] Bloqueado: A origem ${origin} não é permitida.`);
      callback(new Error('A sua origem não tem permissão para acessar este recurso.'));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  credentials: true
};

// --- ORDEM DOS MIDDLEWARES (MUITO IMPORTANTE) ---

// 1. Habilita a resposta para a requisição preflight (OPTIONS) ANTES de qualquer outra rota.
// Isso resolve a maioria dos problemas de CORS com requisições complexas (que usam 'Authorization').
app.options('*', cors(corsOptions));

// 2. Aplica o middleware CORS para todas as outras requisições.
app.use(cors(corsOptions));

// 3. Outros middlewares de segurança
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));
app.set('trust proxy', 1); // Essencial para funcionar atrás de um proxy como o do Easypanel

// 4. Rate Limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 500, // máximo de 500 requisições por IP a cada 15 minutos
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(limiter);

// 5. Parsing do corpo da requisição
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

// --- ROTAS DA APLICAÇÃO ---
// Suas rotas vêm DEPOIS de toda a configuração de CORS e segurança
app.use("/api/auth", authRoutes);
app.use("/api/produtos", produtoRoutes);
app.use("/api/pedidos", pedidoRoutes);
app.use("/api/carrinho", carrinhoRoutes);
app.use("/api/cupons", cupomRoutes);
app.use("/api/blog", blogRoutes);
app.use("/api/downloads", downloadRoutes);
app.use("/api/frete", freteRoutes);
app.use("/api/usuarios", usuarioRoutes);
app.use("/api/categorias", categoriaRoutes);
app.use("/api/enderecos", enderecoRoutes);
app.use("/api/avaliacoes", avaliacaoRoutes);
app.use("/api/pagamentos", pagamentoRoutes);
app.use("/api/uploads", uploadRoutes);
app.use("/api/favoritos", favoritoRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/configuracoes/loja", configuracaoLojaRoutes);
app.use("/api/cep", viaCepRoutes);
app.use("/api/relatorios", relatorioRoutes);
app.use("/api/subscriptions", subscriptionRoutes);

// Servir arquivos estáticos da pasta uploads
app.use("/uploads", express.static("uploads"));

// Rota de teste
app.get("/", (req, res) => {
  res.json({ message: "API Ecommerce funcionando com CORS configurado!" });
});

// Configurar Swagger UI (serve documentação pré-gerada)
const swaggerFile = require('./swagger-output.json');
app.use('/doc', swaggerUi.serve, swaggerUi.setup(swaggerFile));

// Middleware de tratamento de erros (deve ser o último middleware a ser usado)
app.use(tratarErros);

const PORT = process.env.PORT || 3001;

// Inicializar servidor
async function iniciarServidor() {
  try {
    await sequelize.authenticate();
    console.clear();
    console.log("Conexão com banco de dados estabelecida com sucesso.");

    await sequelize.sync({ alter: true }); // 'alter: true' é útil em desenvolvimento, mas use migrações em produção.
    console.log("Modelos sincronizados com o banco de dados.");

    app.listen(PORT, () => {
      console.log(`Servidor rodando na porta ${PORT}`);
      console.log(`Documentação da API disponível em http://localhost:${PORT}/doc`);
    });
  } catch (error) {
    console.error("Erro ao iniciar o servidor:", error);
  }
}

// Iniciar servidor
iniciarServidor();