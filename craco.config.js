const { handleApiRequest } = require("./server/apiRequestHandler");

module.exports = {
  devServer: {
    historyApiFallback: true,
    setupMiddlewares(middlewares) {
      middlewares.unshift({
        name: "exammeta-api",
        middleware: (request, response, next) => {
          if (!handleApiRequest(request, response)) next();
        },
      });
      return middlewares;
    },
  },
  style: {
    postcss: {
      plugins: [require("tailwindcss"), require("autoprefixer")],
    },
  },
};
