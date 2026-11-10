# GAVI POS

Proyecto de punto de venta para una tienda de abarrotes. La aplicación registra ventas y caja por vendedor, comparte stock entre presentaciones y permite sincronizar ventas pendientes desde Android.

## Código de muestra

| Módulo | Función |
| --- | --- |
| `src/shared-stock.mjs` | Cálculo de cantidades y stock compartido |
| `src/sale-amount.mjs` | Conversión de importe a cantidad |
| `src/product-search.mjs` | Búsqueda de productos |
| `src/receipt.mjs` | Formato de tickets para 58 y 80 mm |

El sistema original usa Python, SQLite, HTML, CSS, JavaScript y Android WebView. Esta muestra reúne módulos independientes; no incluye el servidor completo, la APK, el catálogo de la tienda ni datos de operación.
