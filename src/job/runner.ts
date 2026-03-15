import { startJobs } from './index.js'

async function main() {
    startJobs()
}

main().catch(err => {
    console.error(err)
    process.exit(1)
})

