# API GraphQL de productos

API con Express, Apollo Server, GraphQL y Mongoose para MongoDB Atlas. La interfaz Apollo Sandbox está disponible en `/graphql` y la introspección permanece habilitada.

## Requisitos

- Node.js 20 o superior
- Una URI de conexión de MongoDB Atlas

## Ejecución local

1. Instala dependencias con `npm install`.
2. Copia `.env.example` a `.env` y coloca tu URI real en `MONGODB_URI`.
3. Inicia el servidor con `npm run dev` o `npm start`.
4. Abre `http://localhost:4000/graphql` para Apollo Sandbox. El estado está en `http://localhost:4000/health`.

No guardes las credenciales en el repositorio. Si la contraseña contiene caracteres especiales, codifícala para URL. En Atlas, agrega la IP de salida del servicio o una regla de red adecuada para que Render pueda conectar.

## SDL disponible

`Product` contiene `id`, `name`, `price`, `stock`, `category` y `description`.

- `products(filter)` lista y filtra por categoría, texto (`name`, `category` o `description`), precio mínimo/máximo y disponibilidad.
- `product(id)` obtiene un producto por ID.
- `updateProduct(id, input)` actualiza uno o varios de `name`, `price`, `stock`, `category` y `description`.

Ejemplo de consulta:

```graphql
query ProductosDisponibles {
  products(filter: { category: "Accesorios", inStock: true, maxPrice: 100 }) {
    id
    name
    price
    stock
    category
    description
  }
}
```

Ejemplo de mutación:

```graphql
mutation CambiarStock($id: ID!) {
  updateProduct(id: $id, input: { stock: 25 }) {
    id
    name
    stock
  }
}
```

## Despliegue en Render

1. Sube este proyecto a un repositorio Git y crea un Web Service en Render usando ese repositorio, o usa el blueprint `render.yaml`.
2. Render detecta `render.yaml`; el comando de compilación es `npm install` y el de inicio `npm start`.
3. En el panel del servicio, configura `MONGODB_URI` como variable secreta con la cadena completa de Atlas. Render asigna `PORT` automáticamente.
4. Permite la conexión de red del servicio desde MongoDB Atlas y despliega. La API queda en `https://<servicio>.onrender.com/graphql` y el health check en `/health`.

La aplicación enlaza el servidor a `0.0.0.0`, respeta el puerto asignado por Render y no requiere un archivo `.env` en producción.