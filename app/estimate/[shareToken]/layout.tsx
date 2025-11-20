import { Metadata } from 'next'
import { prisma } from '@/lib/prisma'

interface Props {
  params: Promise<{
    shareToken: string
  }>
  children: React.ReactNode
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  try {
    const { shareToken } = await params

    // セッション情報を取得
    const session = await prisma.estimationSession.findUnique({
      where: { shareToken },
      select: {
        name: true,
      },
    })

    const baseTitle = '見積もりポーカー'
    const title = session?.name
      ? `${session.name} - ${baseTitle}`
      : baseTitle

    const description = session?.name
      ? `「${session.name}」の見積もりセッションに参加しましょう`
      : 'プログラミング工数を見積もるためのセッションに参加しましょう'

    return {
      title,
      description,
      openGraph: {
        title,
        description,
        type: 'website',
        siteName: '見積もりポーカー',
      },
      twitter: {
        card: 'summary',
        title,
        description,
      },
    }
  } catch (error) {
    console.error('Error generating metadata:', error)

    // エラー時はデフォルトのメタデータを返す
    return {
      title: '見積もりポーカー',
      description: 'プログラミング工数を見積もるためのセッションに参加しましょう',
      openGraph: {
        title: '見積もりポーカー',
        description: 'プログラミング工数を見積もるためのセッションに参加しましょう',
        type: 'website',
        siteName: '見積もりポーカー',
      },
      twitter: {
        card: 'summary',
        title: '見積もりポーカー',
        description: 'プログラミング工数を見積もるためのセッションに参加しましょう',
      },
    }
  }
}

export default function EstimateLayout({ children }: Props) {
  return <>{children}</>
}
