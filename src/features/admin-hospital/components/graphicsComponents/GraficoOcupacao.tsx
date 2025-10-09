import React from 'react';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    Tooltip,
    ReferenceLine,
    ResponsiveContainer,
    LabelList,
    Label
} from 'recharts';

// 1. Defina os dados para o gráfico
const data = [
    {
        name: 'Enfermaria',
        ocupacao: 65,
        excedente: 10,
    },
    {
        name: 'UTI',
        ocupacao: 80,
        excedente: 15,
    },
    {
        name: 'Apartamentos',
        ocupacao: 50,
        excedente: 0, // Exemplo sem valor excedente
    },
    {
        name: 'Pronto Socorro',
        ocupacao: 95,
        excedente: 5,
    },
];

const metaOcupacao = 65; // Define a meta para a ReferenceLine

function GraficoOcupacao() {
    return (
        // 2. Use o ResponsiveContainer para o gráfico se adaptar ao tamanho do contêiner pai
        <ResponsiveContainer width="50%" height={400}>
            <BarChart
                data={data}
                margin={{
                    top: 20,
                    right: 30,
                    left: 20,
                    bottom: 5,
                }}
            >
                <XAxis dataKey="name" />
                <YAxis unit="%" domain={[0, 100]} />
                <Tooltip
                    formatter={(value) => `${Number(value).toFixed(1)}%`}
                    cursor={{ fill: 'transparent' }}
                />

                {/* 3. A linha de referência (meta) */}
                <ReferenceLine y={metaOcupacao} stroke="#333" strokeDasharray="3 3">
                    <Label value={`Meta: ${metaOcupacao}%`} position="insideTopLeft" fill="#333" />
                </ReferenceLine>

                {/* 4. Barra para a ocupação atingida (verde) */}
                <Bar dataKey="ocupacao" stackId="a" fill="#2E7D32" barSize={80}>
                    <LabelList
                        dataKey="ocupacao"
                        position="center"
                        formatter={(value) => `${value.toFixed(1)}%`}
                        style={{ fill: 'white', fontWeight: 'bold' }}
                    />
                </Bar>

                {/* 5. Barra para o valor excedente (vermelho) */}
                <Bar dataKey="excedente" stackId="a" fill="#C62828" barSize={80}>
                    <LabelList
                        dataKey="excedente"
                        position="center"
                        formatter={(value) => `${value.toFixed(1)}%`}
                        style={{ fill: 'white', fontWeight: 'bold' }}
                    />
                </Bar>
            </BarChart>

        </ResponsiveContainer>
    );
}

export default GraficoOcupacao;