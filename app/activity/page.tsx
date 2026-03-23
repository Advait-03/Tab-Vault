'use client'
import Topbar from '@/components/Topbar'
import DrillPanel from '@/components/DrillPanel'
import TabList from '@/components/TabList'
import CategoryPanel from '@/components/CategoryPanel'

export default function ActivityPage() {
  return (
    <div className="flex flex-col h-screen">
      <Topbar/>
      <div className="flex-1 flex overflow-hidden">
        <DrillPanel/>
        <div className="flex-1 flex overflow-hidden">
          <TabList/>
        </div>
        <div className="hidden lg:flex">
          <CategoryPanel/>
        </div>
      </div>
    </div>
  )
}
