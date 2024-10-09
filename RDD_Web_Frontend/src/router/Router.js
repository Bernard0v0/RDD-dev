import { useRoutes } from 'react-router-dom'
import { observer} from "mobx-react-lite"
import routerstore from '../store/routerstore';

function MyRouter() { 
    
    return useRoutes(routerstore.routes)
}
export default observer(MyRouter)