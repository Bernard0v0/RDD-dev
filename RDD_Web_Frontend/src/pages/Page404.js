import { observer } from "mobx-react-lite"
import routerstore from "../store/routerstore"
import { Result,Button} from 'antd'
import { useNavigate } from "react-router-dom"
function Page404() {
    const nav = useNavigate()
    const onClick = function () {
        nav('/login')
    }
    return  <Result
    status="404"
    title="404"
    subTitle="Sorry, the page you visited does not exist."
        extra={<Button type="primary" onClick={onClick }>Back Home</Button>}
  />
}
export default observer(Page404)