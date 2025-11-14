import { notFound } from 'next/navigation'

interface EmbedDashboardPageProps {
  params: Promise<{
    publicLink: string
  }>
}

export default async function EmbedDashboardPage({ params }: EmbedDashboardPageProps) {
  const { publicLink } = await params

  // TODO: Dashboard model doesn't exist in Prisma schema yet
  // Fetch dashboard by public link using Prisma
  // const dashboard = await db.dashboard.findFirst({
  //   where: {
  //     publicLink: publicLink,
  //     embedEnabled: true
  //   },
  //   include: {
  //     elements: true,
  //     datasources: true
  //   }
  // })

  // if (!dashboard) {
  //   notFound()
  // }
  
  notFound()
}
