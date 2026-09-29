# API GraphQL de productos

API Node.js con Express 5, Apollo Server 5 y Mongoose para MongoDB Atlas. El esquema expone productos, filtros, búsqueda individual y actualización parcial de campos.

## Requisitos

- Node.js 20.19 o superior
- Una base de datos MongoDB Atlas con acceso de red habilitado para el servicio

## Ejecución local

1. Instala las dependencias con `npm install`.
2. Copia `.env.example` como `.env` y asigna `MONGODB_URI` con la cadena de conexión de Atlas.
3. Inicia el servidor con `npm run dev`.
4. Abre `http://localhost:4000/graphql` para Apollo Sandbox. El endpoint de salud es `http://localhost:4000/health`.

No incluyas `.env` en Git. Si la contraseña contiene caracteres especiales, codifícala para URL antes de incorporarla a la URI.

## GraphQL

`products` acepta los filtros opcionales `name` (coincidencia parcial, sin distinguir mayúsculas), `category` (coincidencia exacta, sin distinguir mayúsculas), `minPrice`, `maxPrice` e `inStock`. También existe `product(id)` para buscar un producto.

```graphql
query BuscarProductos {
  products(filter: { category: "Libros", minPrice: 5, maxPrice: 50, inStock: true }) {
    id
    name
    price
    stock
    category
    description
  }
}
```

La mutación `updateProduct` modifica únicamente los campos enviados en `input`. Devuelve `null` si el identificador es válido pero no existe.

```graphql
mutation ActualizarProducto($id: ID!, $input: UpdateProductInput!) {
  updateProduct(id: $id, input: $input) {
    id
    name
    price
    stock
    category
    description
  }
}
```

Variables de ejemplo:

```json
{
  "id": "ID_DEL_PRODUCTO",
  "input": {
    "price": 19.99,
    "stock": 12
  }
}
```

La introspección está habilitada explícitamente y Apollo Sandbox se sirve en `/graphql`.

## Despliegue en Render

1. Sube el proyecto a un repositorio Git y crea un Web Service en Render usando ese repositorio. `render.yaml` define el comando de instalación, el comando de inicio y `/health` como comprobación de salud.
2. En el panel del servicio, añade `MONGODB_URI` como variable secreta con la cadena de conexión de Atlas. No la guardes en `render.yaml` ni en el repositorio.
3. En MongoDB Atlas, permite el acceso de red desde Render según la política de red de tu clúster.
4. Despliega. Render asigna `PORT`; el servidor escucha en ese puerto y en `0.0.0.0`.
5. Prueba `https://<tu-servicio>.onrender.com/health` y abre `https://<tu-servicio>.onrender.com/graphql`.

