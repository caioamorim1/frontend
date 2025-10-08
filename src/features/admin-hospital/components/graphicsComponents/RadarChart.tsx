import React, { useState, FC, CSSProperties, ChangeEvent, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Radar, RadarChart, PolarGrid, Legend, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer } from 'recharts';
import { calcularPerformanceParaGrafico } from '@/mocks/filterMocksRadar';

// 1. Definindo a interface para o tipo de dado do nosso gráfico
interface ChartDataItem {
    subject: string;
    atual: number;
    projetado: number;
}

// 2. Tipando o objeto de estilos
const styles: { [key: string]: CSSProperties } = {
    dashboardContainer: { display: 'flex', fontFamily: 'sans-serif', width: '100%' },
    tableContainer: { flex: 1, padding: '20px' },
    chartContainer: { flex: 1.5, height: '500px' },
    table: { width: '100%', borderCollapse: 'collapse' },
    th: { border: '1px solid #ddd', padding: '8px', textAlign: 'left', backgroundColor: '#f2f2f2' },
    td: { border: '1px solid #ddd', padding: '8px', verticalAlign: 'middle' },
    input: { width: '60px', padding: '5px' },
    iconWrapper: { display: 'flex', gap: '10px' },
    icon: { cursor: 'pointer' },
};

// 3. Definindo o componente como um Functional Component (FC)
const RadarChartComponent: FC<{ data: ChartDataItem[]; title?: string; description?: string }> = ({ data, title, description }) => {
    // 4. Tipando os estados (useState)
    const [editingIndex, setEditingIndex] = useState<number | null>(null);
    const [rowData, setRowData] = useState<Partial<ChartDataItem>>({}); // Partial permite um objeto incompleto

    // 5. Tipando os parâmetros das funções
    const handleEdit = (index: number): void => {
        setEditingIndex(index);
        setRowData(data[index]);
    };

    const handleCancel = (): void => {
        setEditingIndex(null);
        setRowData({});
    };

    const handleSave = (index: number): void => {
        const newData = [...data];
        // Garantimos que rowData tem a estrutura certa antes de salvar
        newData[index] = { ...data[index], ...rowData } as ChartDataItem;
        //setData(newData);
        setEditingIndex(null);
    };

    const handleInputChange = (e: ChangeEvent<HTMLInputElement>, field: 'atual' | 'projetado'): void => {
        const value = parseInt(e.target.value, 10) || 0;
        setRowData({ ...rowData, [field]: value });
    };

    // const tableView = (
    //     <div style={styles.tableContainer}>
    //         <h3>Painel de Controle</h3>
    //         <table style={styles.table}>
    //             <thead>
    //                 <tr>
    //                     <th style={styles.th}>Indicador</th>
    //                     <th style={styles.th}>Atual (%)</th>
    //                     <th style={styles.th}>Projetado (%)</th>
    //                     <th style={styles.th}>Ações</th>
    //                 </tr>
    //             </thead>
    //             <tbody>
    //                 {data.map((item, index) => (
    //                     <tr key={item.subject}>
    //                         <td style={styles.td}>{item.subject}</td>
    //                         {editingIndex === index ? (
    //                             <>
    //                                 <td style={styles.td}>
    //                                     <input type="number" value={rowData.atual ?? 0} onChange={(e) => handleInputChange(e, 'atual')} style={styles.input} />
    //                                 </td>
    //                                 <td style={styles.td}>
    //                                     <input type="number" value={rowData.projetado ?? 0} onChange={(e) => handleInputChange(e, 'projetado')} style={styles.input} />
    //                                 </td>
    //                                 <td style={styles.td}>
    //                                     {/* 6. Movendo onClick para um SPAN que envolve o ícone */}
    //                                     <div style={styles.iconWrapper}>
    //                                         <span onClick={() => handleSave(index)} title="Salvar" style={styles.icon}>
    //                                             <FaSave color="green" />
    //                                         </span>
    //                                         <span onClick={handleCancel} title="Cancelar" style={styles.icon}>
    //                                             <FaTimes color="red" />
    //                                         </span>
    //                                     </div>
    //                                 </td>
    //                             </>
    //                         ) : (
    //                             <>
    //                                 <td style={styles.td}>{item.atual}</td>
    //                                 <td style={styles.td}>{item.projetado}</td>
    //                                 <td style={styles.td}>
    //                                     <div style={styles.iconWrapper}>
    //                                         <span onClick={() => handleEdit(index)} title="Editar" style={styles.icon}>
    //                                             <FaEdit color="blue" />
    //                                         </span>
    //                                     </div>
    //                                 </td>
    //                             </>
    //                         )}
    //                     </tr>
    //                 ))}
    //             </tbody>
    //         </table>
    //     </div>
    // );

    return (
        <Card>
            <CardHeader>
                <CardTitle>{title}</CardTitle>
                <CardDescription>{description}</CardDescription>
            </CardHeader>
            <CardContent>
                <ResponsiveContainer width="100%" height={450}>
                    <RadarChart cx="50%" cy="50%" outerRadius="89%" data={data}>
                        <PolarGrid />
                        <PolarAngleAxis dataKey="subject" />
                        <PolarRadiusAxis angle={30} domain={[0, 100]} tickFormatter={(value: number) => `${value}%`} />
                        <Radar
                            name="ATUAL"
                            dataKey="atual"
                            stroke="#4169E1" // azul escuro
                            fill="#4169E1"   // azul claro
                            fillOpacity={0.2}
                        />
                        <Radar
                            name="PROJETADO"
                            dataKey="projetado"
                            stroke="#0D1A4A" // azul escuro
                            fill="#B0C4FF"   // azul mais claro
                            fillOpacity={0.2}
                        />
                        <Legend />
                    </RadarChart>
                </ResponsiveContainer>
            </CardContent>
        </Card >
    );
};

export default RadarChartComponent;