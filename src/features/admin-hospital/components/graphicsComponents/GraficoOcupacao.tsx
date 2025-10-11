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
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface OcupacaoData {
    name: string;
    ocupacao: number;
    excedente: number;
}

interface GraficoOcupacaoProps {
    data: OcupacaoData[];
    metaOcupacao: number;
    title: string;
}

function GraficoOcupacao({ data, metaOcupacao, title }: GraficoOcupacaoProps) {
    return (
        <Card>
            <CardHeader>
                <CardTitle>{title}</CardTitle>
            </CardHeader>
            <CardContent>
                <ResponsiveContainer width="100%" height={400}>
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
                        <YAxis unit="%" domain={[0, 'dataMax + 10']} />
                        <Tooltip
                            formatter={(value) => `${Number(value).toFixed(1)}%`}
                            cursor={{ fill: 'transparent' }}
                        />

                        <ReferenceLine y={metaOcupacao} stroke="#333" strokeDasharray="3 3">
                            <Label value={`Meta: ${metaOcupacao}%`} position="insideTopLeft" fill="#333" />
                        </ReferenceLine>

                        <Bar dataKey="ocupacao" stackId="a" fill="#2E7D32" barSize={80}>
                            <LabelList
                                dataKey="ocupacao"
                                position="center"
                                formatter={(value) => `${value.toFixed(1)}%`}
                                style={{ fill: 'white', fontWeight: 'bold' }}
                            />
                        </Bar>

                        <Bar dataKey="excedente" stackId="a" fill="#C62828" barSize={80}>
                            <LabelList
                                dataKey="excedente"
                                position="center"
                                formatter={(value) => value > 0 ? `${value.toFixed(1)}%` : ''}
                                style={{ fill: 'white', fontWeight: 'bold' }}
                            />
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            </CardContent>
        </Card>
    );
}

export default GraficoOcupacao;