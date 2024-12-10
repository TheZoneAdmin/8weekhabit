'use client';

import dynamic from 'next/dynamic'

const HabitProgram = dynamic(() => import('@/components/habit-program'), {
  ssr: false // This disables server-side rendering for this component
})

export default function Home() {
  return (
    <main>
      <HabitProgram />
    </main>
  )
}
