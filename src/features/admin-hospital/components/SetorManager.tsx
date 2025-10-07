// import { Trash2, Edit, Hospital, Building2, PlusCircle } from "lucide-react";
// import { Button } from "@/components/ui/button";
// import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
// import { Input } from "@/components/ui/input";
// import { Textarea } from "@/components/ui/textarea";
// import {
//   Select,
//   SelectContent,
//   SelectItem,
//   SelectTrigger,
//   SelectValue,
// } from "@/components/ui/select";
// import { useState } from "react";

// export default function SetorManager() {

//     const [selectedCargoId, setSelectedCargoId] = useState("");
//     const [quantidadeFuncionarios, setQuantidadeFuncionarios] = useState(1);
  

//    const handleAddCargo = () => {
//     console.log("ANTES DE ADICIONAR. Estado atual:", cargos_unidade);
//     if (!selectedCargoId || quantidadeFuncionarios <= 0) {
//       alert("Selecione um cargo e informe uma quantidade válida.");
//       return;
//     }
//     if (cargos_unidade.find((c) => c.cargoId === selectedCargoId)) {
//       alert("Este cargo já foi adicionado.");
//       return;
//     }
//     const cargoSelecionado = cargosHospital.find(
//       (c) => c.id === selectedCargoId
//     );

//     setCargosUnidade([
//       ...cargos_unidade,
//       {
//         cargoId: selectedCargoId,
//         quantidade_funcionarios: quantidadeFuncionarios,
//         nome: cargoSelecionado?.nome || "Cargo desconhecido",
//       },
//     ]);
//     setSelectedCargoId("");
//     setQuantidadeFuncionarios(1);
//   };


//   return (<Card className="animate-fade-in-down">
        
//           <CardContent>
//                 <div className="space-y-3 pt-4">
//                   <h3 className="font-semibold text-lg text-primary">
//                     Adicionar Cargos na Unidade
//                   </h3>
//                   <div className="flex items-center gap-4">
//                     <Select
//                       onValueChange={setSelectedCargoId}
//                       value={selectedCargoId}
//                     >
//                       <SelectTrigger>
//                         <SelectValue placeholder="Selecione um cargo" />
//                       </SelectTrigger>
//                       <SelectContent>
//                         {cargosHospital.map((cargo) => (
//                           <SelectItem key={cargo.id} value={cargo.id}>
//                             {cargo.nome}
//                           </SelectItem>
//                         ))}
//                       </SelectContent>
//                     </Select>
//                     <Input
//                       type="number"
//                       value={quantidadeFuncionarios}
//                       onChange={(e) =>
//                         setQuantidadeFuncionarios(Number(e.target.value))
//                       }
//                       min="1"
//                       className="w-24"
//                       placeholder="Qtd."
//                     />
//                     <Button type="button" onClick={handleAddCargo} size="icon">
//                       <PlusCircle className="h-4 w-4" />
//                     </Button>
//                   </div>
//                   {cargos_unidade.length > 0 && (
//                     <div className="space-y-2 mt-2">
//                       {cargos_unidade.map((cargo) => (
//                         <div
//                           key={cargo.cargoId}
//                           className="flex justify-between items-center p-2 bg-gray-50 rounded-md"
//                         >
//                           <span>
//                             {cargo.nome} (Qtd: {cargo.quantidade_funcionarios})
//                           </span>
//                           <Button
//                             type="button"
//                             variant="ghost"
//                             size="icon"
//                             onClick={() => handleRemoveCargo(cargo.cargoId)}
//                             className="text-red-500 hover:text-red-700 h-6 w-6"
//                           >
//                             <Trash2 size={16} />
//                           </Button>
//                         </div>
//                       ))}
//                     </div>
//                   )}
//                 </div>

//                 <div className="flex justify-end gap-4">
//                   <Button type="button" variant="ghost" onClick={resetForm}>
//                     {editingUnidade ? "Cancelar Edição" : "Voltar"}
//                   </Button>
//                   <Button type="submit">
//                     {editingUnidade ? "Salvar Alterações" : "Salvar Setor"}
//                   </Button>
//                 </div>
//               </form>
//             )}
//           </CardContent>
//         </Card >
//         );
// }
          
          