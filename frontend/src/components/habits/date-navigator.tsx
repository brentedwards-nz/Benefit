'use client'

import { useRouter } from 'next/navigation'
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/solid'
import { startOfWeek, addDays, format } from 'date-fns'

export default function DateNavigator({ currentDate }: { currentDate: Date }) {
  const router = useRouter()
  const weekStartsOn = 1 // Monday
  const weekStart = startOfWeek(currentDate, { weekStartsOn })

  const handleDateChange = (days: number) => {
    const newDate = addDays(currentDate, days)
    router.push(
      `/dashboard/client/habits/weekly?date=${format(newDate, 'yyyy-MM-dd')}`,
    )
  }

  return (
    <div className="flex items-center justify-between mb-4">
      <button
        onClick={() => router.back()}
        className="p-2 rounded-full hover:bg-gray-200"
      >
        <ChevronLeftIcon className="w-6 h-6 text-gray-600" />
      </button>
      <div className="flex items-center">
        <button
          onClick={() => handleDateChange(-7)}
          className="p-2 rounded-full hover:bg-gray-200"
        >
          <ChevronLeftIcon className="w-6 h-6 text-gray-600" />
        </button>
        <h2 className="text-lg font-semibold mx-4">
          {format(weekStart, 'MMMM d')} -{' '}
          {format(addDays(weekStart, 6), 'MMMM d, yyyy')}
        </h2>
        <button
          onClick={() => handleDateChange(7)}
          className="p-2 rounded-full hover:bg-gray-200"
        >
          <ChevronRightIcon className="w-6 h-6 text-gray-600" />
        </button>
      </div>
      <div className="w-8"></div> {/* Placeholder for alignment */}
    </div>
  )
}
