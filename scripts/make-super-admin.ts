import { prisma } from '../src/lib/prisma'

async function main() {
  const email = process.argv[2]
  
  if (!email) {
    console.error("Please provide an email address as the first argument.")
    console.error("Usage: npx tsx scripts/make-super-admin.ts <email>")
    process.exit(1)
  }

  console.log(`Looking up user with email: ${email}...`)
  
  const user = await prisma.user.findUnique({
    where: { email },
  })

  if (!user) {
    console.error(`User with email ${email} not found.`)
    
    // Optional: Let's try to search by name if it's "Juratbek Ashirboyev"
    console.log("Searching by name to see if we can find a match...")
    const usersByName = await prisma.user.findMany({
      where: {
        name: {
          contains: email,
          mode: 'insensitive'
        }
      }
    });

    if (usersByName.length > 0) {
      console.log("Found potential matches by name:")
      usersByName.forEach(u => console.log(`- ${u.name} (${u.email})`))
      console.log("\nPlease run the script again using one of these exact emails.")
    }

    process.exit(1)
  }

  console.log(`Found user: ${user.name} (${user.email}). Current role: ${user.role}`)

  const updatedUser = await prisma.user.update({
    where: { email },
    data: { role: 'SUPER_ADMIN' },
  })

  console.log(`\nSuccess! Granted SUPER_ADMIN role to ${updatedUser.name} (${updatedUser.email})`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
