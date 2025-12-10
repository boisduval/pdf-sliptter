import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'
import path from 'path'
import fs from 'fs'
import archiver from 'archiver'

// Custom plugin to zip dist folder
const zipBuild = (env) => {
  return {
    name: 'zip-build',
    closeBundle: {
      sequential: true,
      async handler() {
        if (env.VITE_BUILD_ZIP !== 'true') return

        const outDir = 'dist'
        const zipName = 'dist.zip'

        console.log(`\nZipping ${outDir} to ${zipName}...`)

        const output = fs.createWriteStream(path.join(process.cwd(), zipName))
        const archive = archiver('zip', {
          zlib: { level: 9 } // Sets the compression level.
        })

        return new Promise((resolve, reject) => {
          output.on('close', function () {
            console.log(
              `Zip created: ${zipName} (${archive.pointer()} total bytes)`
            )
            resolve()
          })

          archive.on('warning', function (err) {
            if (err.code === 'ENOENT') {
              console.warn(err)
            } else {
              reject(err)
            }
          })

          archive.on('error', function (err) {
            reject(err)
          })

          archive.pipe(output)
          archive.directory(outDir, false)
          archive.finalize()
        })
      }
    }
  }
}

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  // Set the third parameter to '' to load all env regardless of the `VITE_` prefix.
  const env = loadEnv(mode, process.cwd(), '')

  return {
    base: env.VITE_BASE_URL || '/',
    plugins: [vue(), zipBuild(env)],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src')
      }
    }
  }
})
