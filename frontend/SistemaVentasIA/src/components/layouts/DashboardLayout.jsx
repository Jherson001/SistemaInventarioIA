import React, { useContext } from 'react'
import useApi from "../../hooks/useApi";
import useAuth from "../../hooks/useAuth";
import NavBar from './NavBar'
import SideMenu from './SideMenu'

const DashboardLayout = ({ children, activeMenu }) => {

    const { user } = useAuth();
    console.log(user)

    return (
        <div className="">
            <NavBar activeMenu={activeMenu} />

            {user && (
                <div className="flex">
                    <div className="max-[1080px]:hidden">
                        <SideMenu activeMenu={activeMenu} />
                    </div>

                    <div className="grow mx-5">{children}</div>
                </div>
            )}
        </div>
    )
}

export default DashboardLayout