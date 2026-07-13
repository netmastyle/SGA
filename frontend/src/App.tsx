import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Warehouses from './pages/Warehouses';
import WarehouseDetail from './pages/WarehouseDetail';
import WarehouseViewer3D from './pages/WarehouseViewer3D';
import Items from './pages/Items';
import Inventory from './pages/Inventory';
import Containers from './pages/Containers';
import SerialNumbers from './pages/SerialNumbers';
import Layout from './components/Layout';
import ProtectedRoute from './router/ProtectedRoute';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route element={<ProtectedRoute />}>
          <Route element={<Layout />}>
            <Route path="/" element={<Dashboard />} />
            <Route path="/warehouses" element={<Warehouses />} />
            <Route path="/warehouses/:id" element={<WarehouseDetail />} />
            <Route path="/warehouses/:id/3d" element={<WarehouseViewer3D />} />
            <Route path="/items" element={<Items />} />
            <Route path="/inventory" element={<Inventory />} />
            <Route path="/containers" element={<Containers />} />
            <Route path="/serial-numbers" element={<SerialNumbers />} />
          </Route>
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
