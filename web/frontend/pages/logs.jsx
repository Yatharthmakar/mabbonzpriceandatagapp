import LogsDisplay from '../components/LogsDisplay';
import SelectedLog from '../components/SelectedLog';
import { useNavigate, useSearchParams } from "react-router-dom";


export default function logs() {
  const [searchParams, setSearchParams] = useSearchParams();
  let routerNavigate = useNavigate();

  return (
    searchParams.get('log')
    ? <SelectedLog searchParams={searchParams} />
    : <LogsDisplay  searchParams={searchParams}/>
  )
}
