import React from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { useToast } from "@/components/ui/use-toast";

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

const DynamicUIComponent = ({ uiSchema, onAction }) => {
  const { toast } = useToast();

  if (!uiSchema || !uiSchema.type) {
    return (
      <Card className="w-full bg-white/80 backdrop-blur-sm">
        <CardHeader>
          <CardTitle>Attendere prego...</CardTitle>
          <CardDescription>L'AI sta elaborando la tua interfaccia personalizzata.</CardDescription>
        </CardHeader>
        <CardContent>
          <p>Nessun elemento UI da visualizzare al momento.</p>
        </CardContent>
      </Card>
    );
  }
  
  const renderElement = (element) => {
    switch (element.type) {
      case 'card':
        return (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-6"
          >
            <Card className="w-full bg-white/90 shadow-lg">
              {element.title && (
                <CardHeader>
                  <CardTitle>{element.title}</CardTitle>
                  {element.description && <CardDescription>{element.description}</CardDescription>}
                </CardHeader>
              )}
              <CardContent className="space-y-4">
                {element.children && element.children.map((child, index) => (
                  <div key={index}>{renderElement(child)}</div>
                ))}
              </CardContent>
            </Card>
          </motion.div>
        );
      case 'text':
        return <p className={`text-${element.size || 'base'} ${element.bold ? 'font-semibold' : ''} ${element.color || 'text-gray-700'}`}>{element.content}</p>;
      case 'button':
        return (
          <Button
            onClick={() => element.action ? onAction(element.action, element.payload) : toast({ title: "🚧 Funzione non implementata", description: "Questa azione AI non è ancora configurata."})}
            variant={element.variant || 'default'}
            size={element.size || 'default'}
            className="my-2"
          >
            {element.label}
          </Button>
        );
      case 'buttonGroup':
        return (
          <div className="flex flex-wrap gap-2 my-2">
            {element.buttons.map((btn, idx) => (
              <Button
                key={idx}
                onClick={() => btn.action ? onAction(btn.action, btn.payload) : toast({ title: "🚧 Funzione non implementata", description: "Questa azione AI non è ancora configurata."})}
                variant={btn.variant || 'outline'}
                size={btn.size || 'sm'}
              >
                {btn.label}
              </Button>
            ))}
          </div>
        );
      case 'barChart':
        return (
          <div className="my-4 h-72 md:h-96">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={element.data} margin={{ top: 5, right: 20, left: -20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                {element.bars.map((bar, idx) => (
                  <Bar key={idx} dataKey={bar.dataKey} fill={bar.color || COLORS[idx % COLORS.length]} />
                ))}
              </BarChart>
            </ResponsiveContainer>
          </div>
        );
      case 'pieChart':
        return (
          <div className="my-4 h-72 md:h-96 flex justify-center items-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={element.data}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={Math.min(window.innerWidth / 4, 120)}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {element.data.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        );
      default:
        return <p className="text-red-500">Elemento UI sconosciuto: {element.type}</p>;
    }
  };

  return renderElement(uiSchema);
};

export default DynamicUIComponent;