// import { useState, useEffect, FormEvent } from "react";
// import {
//   getQuestionarios,
//   createQuestionario,
//   updateQuestionario,
//   deleteQuestionario,
//   Questionario,
//   CreateQuestionarioDTO,
// } from "@/lib/api";
// import { Trash2, Edit, PlusCircle } from "lucide-react";
// import { Question } from "@/features/qualitativo/types";

// const initialFormState: CreateQuestionarioDTO = {
//   name: "",
//   questions: [],
// };

// const initialQuestionState: Omit<Question, "id"> = {
//   text: "",
//   type: "sim-nao-na",
//   weight: 1,
//   categoryId: 1,
//   options: [],
// };

// export default function QuestionariosPage() {
//   const [questionarios, setQuestionarios] = useState<Questionario[]>([]);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState<string | null>(null);

//   const [isFormVisible, setIsFormVisible] = useState(false);
//   const [formData, setFormData] =
//     useState<Partial<Questionario>>(initialFormState);

//   const fetchData = async () => {
//     setLoading(true);
//     setError(null);
//     try {
//       const data = await getQuestionarios();
//       setQuestionarios(data);
//     } catch (err) {
//       setError("Falha ao carregar os questionários.");
//     } finally {
//       setLoading(false);
//     }
//   };

//   useEffect(() => {
//     fetchData();
//   }, []);

//   const handleEdit = (questionario: Questionario) => {
//     setFormData(questionario);
//     setIsFormVisible(true);
//   };

//   const handleAddNew = () => {
//     setFormData(initialFormState);
//     setIsFormVisible(true);
//   };

//   const handleCancel = () => {
//     setIsFormVisible(false);
//     setFormData(initialFormState);
//   };

//   const handleSubmit = async (e: FormEvent) => {
//     e.preventDefault();
//     if (
//       !formData.name?.trim() ||
//       !formData.questions ||
//       formData.questions.length === 0
//     ) {
//       setError("O nome e pelo menos uma pergunta são obrigatórios.");
//       return;
//     }

//     try {
//       if (formData.id) {
//         await updateQuestionario(
//           formData.id,
//           formData as CreateQuestionarioDTO
//         );
//       } else {
//         await createQuestionario(formData as CreateQuestionarioDTO);
//       }
//       handleCancel();
//       fetchData();
//     } catch (err) {
//       setError(formData.id ? "Falha ao atualizar." : "Falha ao criar.");
//     }
//   };

//   const handleDelete = async (id: number | string) => {
//     if (window.confirm("Tem certeza que deseja excluir este questionário?")) {
//       try {
//         await deleteQuestionario(id);
//         fetchData();
//       } catch (err) {
//         setError("Falha ao excluir o questionário.");
//       }
//     }
//   };

//   // --- Funções para manipular perguntas no formulário ---
//   const addQuestion = () => {
//     setFormData((prev) => ({
//       ...prev,
//       questions: [
//         ...(prev.questions || []),
//         { ...initialQuestionState, id: Date.now() },
//       ],
//     }));
//   };

//   const removeQuestion = (index: number) => {
//     setFormData((prev) => ({
//       ...prev,
//       questions: prev.questions?.filter((_, i) => i !== index),
//     }));
//   };

//   const handleQuestionChange = (
//     index: number,
//     field: keyof Question,
//     value: any
//   ) => {
//     const updatedQuestions = [...(formData.questions || [])];
//     updatedQuestions[index] = { ...updatedQuestions[index], [field]: value };
//     setFormData((prev) => ({ ...prev, questions: updatedQuestions }));
//   };

//   return (
//     <div className="space-y-6">
//       <div className="flex justify-between items-center">
//         <h1 className="text-3xl font-bold text-primary">
//           Gestão de Questionários
//         </h1>
//         <button
//           onClick={isFormVisible ? handleCancel : handleAddNew}
//           className="px-4 py-2 text-white bg-secondary rounded-md hover:opacity-90 transition-opacity"
//         >
//           {isFormVisible ? "Cancelar" : "+ Novo Questionário"}
//         </button>
//       </div>

//       {isFormVisible && (
//         <div className="bg-white p-6 rounded-lg border animate-fade-in-down">
//           <form onSubmit={handleSubmit} className="space-y-6">
//             <h2 className="text-xl font-semibold text-primary">
//               {formData.id ? "Editar" : "Novo"} Questionário
//             </h2>

//             <div>
//               <label className="block text-sm font-medium">
//                 Nome do Questionário
//               </label>
//               <input
//                 value={formData.name || ""}
//                 onChange={(e) =>
//                   setFormData((p) => ({ ...p, name: e.target.value }))
//                 }
//                 className="mt-1 w-full p-2 border rounded-md"
//                 required
//               />
//             </div>

//             <div className="space-y-4">
//               <h3 className="text-lg font-medium">Perguntas</h3>
//               {formData.questions?.map((question, index) => (
//                 <div
//                   key={question.id || index}
//                   className="p-4 border rounded-md bg-slate-50 space-y-2"
//                 >
//                   <div className="flex justify-between items-center">
//                     <p className="font-semibold text-sm">
//                       Pergunta {index + 1}
//                     </p>
//                     <button
//                       type="button"
//                       onClick={() => removeQuestion(index)}
//                       className="text-red-500"
//                     >
//                       <Trash2 size={16} />
//                     </button>
//                   </div>
//                   <input
//                     value={question.text}
//                     onChange={(e) =>
//                       handleQuestionChange(index, "text", e.target.value)
//                     }
//                     placeholder="Texto da Pergunta"
//                     className="w-full p-1 border rounded"
//                   />
//                   <select
//                     value={question.type}
//                     onChange={(e) =>
//                       handleQuestionChange(index, "type", e.target.value)
//                     }
//                     className="w-full p-1 border rounded text-sm"
//                   >
//                     <option value="sim-nao-na">Sim / Não / N/A</option>
//                     <option value="texto">Texto</option>
//                     <option value="numero">Número</option>
//                     <option value="data">Data</option>
//                     <option value="multipla-escolha">Múltipla Escolha</option>
//                   </select>
//                 </div>
//               ))}
//               <button
//                 type="button"
//                 onClick={addQuestion}
//                 className="text-sm text-secondary flex items-center gap-1"
//               >
//                 <PlusCircle size={16} /> Adicionar Pergunta
//               </button>
//             </div>

//             <div className="flex justify-end pt-4 border-t">
//               <button
//                 type="submit"
//                 className="px-4 py-2 text-white bg-green-600 rounded-md hover:bg-green-700"
//               >
//                 Salvar Questionário
//               </button>
//             </div>
//           </form>
//         </div>
//       )}

//       <div className="bg-white p-6 rounded-lg border">
//         {loading && <p>Carregando...</p>}
//         {error && <p className="text-red-500">{error}</p>}
//         {!loading && !error && (
//           <table className="min-w-full">
//             <thead>
//               <tr className="border-b">
//                 <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
//                   Nome
//                 </th>
//                 <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
//                   Nº de Perguntas
//                 </th>
//                 <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
//                   Ações
//                 </th>
//               </tr>
//             </thead>
//             <tbody className="divide-y divide-gray-200">
//               {questionarios.map((q) => (
//                 <tr key={q.id}>
//                   <td className="px-6 py-4 font-medium">{q.name}</td>
//                   <td className="px-6 py-4">{q.questions.length}</td>
//                   <td className="px-6 py-4 text-right space-x-2">
//                     <button
//                       onClick={() => handleEdit(q)}
//                       className="text-secondary"
//                     >
//                       <Edit size={18} />
//                     </button>
//                     <button
//                       onClick={() => handleDelete(q.id)}
//                       className="text-red-600"
//                     >
//                       <Trash2 size={18} />
//                     </button>
//                   </td>
//                 </tr>
//               ))}
//             </tbody>
//           </table>
//         )}
//       </div>
//     </div>
//   );
// }
