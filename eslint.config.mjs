import {defineConfig,globalIgnores} from 'eslint/config';
import nextVitals from 'eslint-config-next/core-web-vitals';
import nextTs from 'eslint-config-next/typescript';
// MapLibre files are copied verbatim from node_modules by predev/prebuild.
export default defineConfig([...nextVitals,...nextTs,globalIgnores(['.next/**','next-env.d.ts','artifacts/**','public/maplibre/**']),{files:['src/features/**/domain.ts'],rules:{'no-restricted-imports':['error',{patterns:['next/*','react','@/infrastructure/*']}]}}]);
