import React, { useEffect } from 'react';
import { observer } from "mobx-react-lite";
import { Layout, Menu } from 'antd';
import { Outlet, useNavigate} from 'react-router-dom';
import routerstore from '../store/routerstore';
import Logo from '../assets/logo.jpg'
import '../assets/Main.css'

const { Header, Content } = Layout;
function Home() {
  const nav = useNavigate()
  if (routerstore.url === '') { 
    routerstore.getUrl()
  }
  useEffect(() => {
      if(routerstore.user==='visitor'){
          nav('/login')
      }
      else{
          nav('/upload')
      }
   }, [])
  return (
    <Layout>
      <Header
        style={{  
          display: 'flex',
          alignItems: 'center',
        }}
      >
        <div className="logo"><img src={Logo} alt='Logo'></img></div>
        <span style={{color:'white',margin:'1rem'}}>Welcome, {routerstore.user}</span>
        <Menu
          theme="dark"
          mode="horizontal"
          defaultSelectedKeys={['01']}
          selectedKeys={[routerstore.selectkey]}
          items={routerstore.menus}
          style={{
            flex: 1,
            minWidth: 0,
          }}
        />
      </Header>
      <Content
        style={{
          padding: '1.5rem 3rem',
        }}
      >
        <Outlet></Outlet>
      </Content>

    </Layout>
  );
};
export default observer(Home);