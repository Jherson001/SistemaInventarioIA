import React, { useContext, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import DashboardLayout from '../../components/layouts/DashboardLayout'
import moment from 'moment'
import { LuArrowRight } from 'react-icons/lu'

const COLORS = ["#8D51FF", "#00B8DB", "#7BCE00"]

const Dashboard = () => {
  const navigate = useNavigate()

  useEffect(() => {
    return () => { }
  }, [])

  return (
    <DashboardLayout activeMenu="Dashboard">
      <div className="card my-5">
        <div>
          <div className="col-span-3">
            <h2 className="text-xl md:text-2xl">Buenos días!</h2>
            <p className="text-xs md:text-[13px] text-gray-400 mt-1.5">
              {moment().format("dddd Do MM YYYY")}
            </p>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}

export default Dashboard