// main.js (StarUML Extension) - PickClassStarUml
// Correção principal: buscar classes via app.repository.select("@UMLClass")
// Robustez: tratar projeto sem classes, evitar undefined em FIT e index -1.

const XLSX = require("xlsx");
const _ = require("lodash");

exports.init = init;

function init() {
  app.commands.register("PickClass:start", start, "Pick Class (start)");
}

function start() {
  generateCSV();
}

function generateCSV() {
  const project = app.project.getProject();
  const projectName = project?.name || "Projeto";

  // ✅ Pega TODAS as UMLClass do projeto (não depende de ownedElements do Project/Model/Diagram)
  let classesForIntegration = app.repository.select("@UMLClass") || [];

  // Evita duplicados e itens sem nome
  classesForIntegration = _(classesForIntegration)
    .filter(c => c && c.name)
    .uniqBy(c => c._id)
    .orderBy(["name"], ["asc"])
    .value();

  // ✅ Se não achou classe nenhuma, evita crash e avisa
  if (classesForIntegration.length === 0) {
    app.dialogs.showAlertDialog("Nenhuma UMLClass encontrada no projeto. Verifique se você criou classes UML (UMLClass).");
    return;
  }

  const workbook = XLSX.utils.book_new();
  const sheet = [];
  const integratedClasses = [];

  // Header: "", "IF", "LIF1" ... "LIFN"
  // Seu createHeaderSheet usa i < classCount, então passar (N + 1) cria N colunas LIF.
  const headerSheett = createHeaderSheet(classesForIntegration.length + 1);
  sheet.push(headerSheett);

  let arrayFi = generateFI(classesForIntegration);
  arrayFi = _.orderBy(arrayFi, "className", "asc");

  const table = [];
  arrayFi.forEach(element => {
    table.push([element.className, element.classFICount]);
  });

  // FIT inicial (com base nos FIs)
  const arrayFIT = [];
  classesForIntegration.forEach(cfi => {
    const fit = getFit(cfi.name, arrayFi);
    arrayFIT.push({ className: cfi.name, fit });
  });

  // Preenche LIF1..LIFN e calcula a ordem de integração
  for (let i = 1; i <= classesForIntegration.length; i++) {
    // Adiciona a coluna LIF(i) na tabela
    for (const row of table) {
      const className = row[0];
      const fitValue = _.find(arrayFIT, f => f.className === className);
      // Robustez: se não encontrar, coloca 0 (evita crash)
      row.push(fitValue ? fitValue.fit : 0);
    }

    const chosenClass = chooseClass(arrayFIT, arrayFi);

    // Calcula stubs necessários: classes ainda NÃO integradas que dependem da escolhida
    let stubsInChosenClass = "";

    const arrayFINotIntegrated = arrayFi.filter(item => !item.hasIntegrated);

    arrayFINotIntegrated.forEach(classNotIntegrated => {
      const classIncluded = _.find(
        classNotIntegrated.classesCompositeFi,
        ic => ic.name === chosenClass.className
      );
      if (classIncluded) {
        stubsInChosenClass += " Stub " + classNotIntegrated.className;
      }
    });

    integratedClasses.push({
      order: i,
      className: chosenClass.className,
      stubs: stubsInChosenClass
    });
  }

  // Monta planilha final
  table.forEach(line => sheet.push(line));

  sheet.push([]);
  sheet.push(["IF = Number of integrated classes AFTER the given class."]);
  sheet.push(["LIF = Sum of the FIs of the integrated classes BEFORE the given class."]);
  sheet.push([]);
  sheet.push(["Integration order"]);

  integratedClasses.forEach(item => {
    sheet.push([item.order, item.className, item.stubs]);
  });

  const worksheet = XLSX.utils.aoa_to_sheet(sheet);
  XLSX.utils.book_append_sheet(workbook, worksheet, "Planilha 1");

  // Download do XLSX
  const buffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });
  const blob = new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
  });

  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = projectName + ".xlsx";
  link.click();
  URL.revokeObjectURL(url);
}

// (Não usado mais — pode remover se quiser)
function getAllClass(diagrams) {
  const result = [];
  for (let i = 1; i < diagrams.ownedElements.length; i++) {
    result.push(diagrams.ownedElements[i]);
  }
  return result;
}

function createHeaderSheet(classCount) {
  const header = [];
  header.push("");
  header.push("IF");
  for (let i = 1; i < classCount; i++) {
    header.push("LIF" + i);
  }
  return header;
}

function generateFI(classesForIntegration) {
  const result = [];

  classesForIntegration.forEach(classe => {
    const listAssociationsAnalyzed = [];

    // Segurança: algumas classes podem não ter ownedElements definido
    const owned = classe.ownedElements || [];
    owned.forEach(element => {
      const compositeFI = { id: "", name: "" };

      if (element instanceof type.UMLGeneralization) {
        if (element.target) {
          const specializedClass = element.source;
          compositeFI.id = specializedClass._id;
          compositeFI.name = specializedClass.name;

          const generalizationClass = element.target;
          const indexGeneralizationClass = _.findIndex(result, x => x.className === generalizationClass.name);

          if (hasCalculatedFIForClass(indexGeneralizationClass)) {
            result[indexGeneralizationClass].classFICount++;
            result[indexGeneralizationClass].classesCompositeFi.push(compositeFI);
          } else {
            const targetElementAssociation = createFIObject(generalizationClass._id, generalizationClass.name, compositeFI);
            result.push(targetElementAssociation);
          }
        }
      } else if (element instanceof type.UMLAssociation) {
        const classOfRelationship = element.end2.reference;
        const indexAssociationsAnalyzed = _.findIndex(listAssociationsAnalyzed, x => x === classOfRelationship.name);
        const unanalyzedAssociation = indexAssociationsAnalyzed === -1;

        if (unanalyzedAssociation) {
          listAssociationsAnalyzed.push(classOfRelationship.name);

          const isTargetPartAssociation =
            element.end2.aggregation === "shared" || element.end2.aggregation === "composite";

          const isDirectAssociationOrBidirectionalAssociation = element.end2.aggregation === "none";

          if (isDirectAssociationOrBidirectionalAssociation) {
            const firstReference = element.end1.reference;
            compositeFI.id = firstReference._id;
            compositeFI.name = firstReference.name;

            const secondReference = element.end2.reference;
            const indexSecondReference = _.findIndex(result, x => x.className === secondReference.name);

            if (hasCalculatedFIForClass(indexSecondReference)) {
              result[indexSecondReference].classFICount++;
              result[indexSecondReference].classesCompositeFi.push(compositeFI);
            } else {
              const secondElementAssociation = createFIObject(secondReference._id, secondReference.name, compositeFI);
              result.push(secondElementAssociation);
            }

            const isBidirectionalAssociation = element.end2.navigable === "unspecified";
            if (isBidirectionalAssociation) {
              const secondRef = element.end2.reference;
              const isCircularReference = secondRef.name === firstReference.name;

              if (!isCircularReference) {
                const unspecifiedComposite = { id: secondRef._id, name: secondRef.name };
                const indexUnspecified = _.findIndex(result, x => x.className === firstReference.name);

                if (hasCalculatedFIForClass(indexUnspecified)) {
                  result[indexUnspecified].classFICount++;
                  result[indexUnspecified].classesCompositeFi.push(unspecifiedComposite);
                } else {
                  const firstElementAssociation = createFIObject(firstReference._id, firstReference.name, unspecifiedComposite);
                  result.push(firstElementAssociation);
                }
              }
            }
          } else if (isTargetPartAssociation) {
            const targetClass = element.end2.reference;
            compositeFI.id = targetClass._id;
            compositeFI.name = targetClass.name;

            const indexPartClass = _.findIndex(result, x => x.className === classe.name);
            if (hasCalculatedFIForClass(indexPartClass)) {
              result[indexPartClass].classFICount++;
              result[indexPartClass].classesCompositeFi.push(compositeFI);
            } else {
              const classFI = createFIObject(classe._id, classe.name, compositeFI);
              result.push(classFI);
            }
          }
        }
      } else if (element instanceof type.UMLAssociationClassLink) {
        compositeFI.id = classe._id;
        compositeFI.name = classe.name;

        const firstReference = element.associationSide.end1.reference;
        const secondReference = element.associationSide.end2.reference;

        const indexFirstReference = _.findIndex(result, x => x.className === firstReference.name);
        const indexSecondReference = _.findIndex(result, x => x.className === secondReference.name);

        if (hasCalculatedFIForClass(indexFirstReference)) {
          result[indexFirstReference].classFICount++;
          result[indexFirstReference].classesCompositeFi.push(compositeFI);
        } else {
          const firstElementAssociation = createFIObject(firstReference._id, firstReference.name, compositeFI);
          result.push(firstElementAssociation);
        }

        const isSelfAssociation = indexSecondReference === indexFirstReference;
        if (!isSelfAssociation) {
          if (hasCalculatedFIForClass(indexSecondReference)) {
            result[indexSecondReference].classFICount++;
            result[indexSecondReference].classesCompositeFi.push(compositeFI);
          } else {
            const secondElementAssociation = createFIObject(secondReference._id, secondReference.name, compositeFI);
            result.push(secondElementAssociation);
          }
        }
      }
    });
  });

  // Garante que toda classe tenha FI (mesmo que seja 0)
  classesForIntegration.forEach(classe => {
    const indexClass = _.findIndex(result, x => x.className === classe.name);

    if (!hasCalculatedFIForClass(indexClass)) {
      result.push({
        classId: classe._id,
        className: classe.name,
        classFICount: 0,
        classesCompositeFi: [],
        hasIntegrated: false
      });
    }
  });

  return result;
}

function getFit(className, arrayFi) {
  let countFIS = 0;

  arrayFi.forEach(element2 => {
    const item = _.find(element2.classesCompositeFi, ["name", className]);
    if (item) {
      countFIS += element2.classFICount;
    }
  });

  return countFIS;
}

function chooseClass(arrayFIT, arrayFi) {
  const arrayFINotIntegrated = arrayFIT.filter(item => item.fit !== "-");

  // Segurança: se por algum motivo não houver candidato
  if (arrayFINotIntegrated.length === 0) {
    // fallback: pega qualquer FI não integrado
    const fallback = arrayFi.find(fi => !fi.hasIntegrated);
    return fallback || arrayFi[0];
  }

  let candidatesClassFIT = [arrayFINotIntegrated[0]];
  let item = _.find(arrayFi, ["className", candidatesClassFIT[0].className]);
  let candidatesClass = [item];

  for (let i = 1; i < arrayFINotIntegrated.length; i++) {
    if (arrayFINotIntegrated[i].fit < candidatesClassFIT[0].fit) {
      candidatesClassFIT = [arrayFINotIntegrated[i]];
      candidatesClass = [_.find(arrayFi, ["className", arrayFINotIntegrated[i].className])];
    } else if (arrayFINotIntegrated[i].fit === candidatesClassFIT[0].fit) {
      candidatesClassFIT.push(arrayFINotIntegrated[i]);
      candidatesClass.push(_.find(arrayFi, ["className", arrayFINotIntegrated[i].className]));
    }
  }

  let result = candidatesClass[0];
  if (candidatesClass.length > 1) {
    candidatesClass.forEach(element => {
      if (element.classFICount > result.classFICount) {
        result = element;
      }
    });
  }

  arrayFi.forEach(fiObject => {
    if (result.className === fiObject.className) {
      fiObject.hasIntegrated = true;

      fiObject.classesCompositeFi.forEach(classCompositeFIObject => {
        const index = _.findIndex(arrayFIT, x => x.className === classCompositeFIObject.name);

        // ✅ Robustez: se não existir no arrayFIT, ignora
        if (index < 0) return;

        const classCompositeHasIntegrated = arrayFIT[index].fit === "-";
        if (!classCompositeHasIntegrated) {
          arrayFIT[index].fit = arrayFIT[index].fit - result.classFICount;
        }
      });

      const indexResult = _.findIndex(arrayFIT, x => x.className === result.className);
      if (indexResult >= 0) arrayFIT[indexResult].fit = "-";
    }
  });

  return result;
}

function createFIObject(classId, className, compositeFI) {
  return {
    classId,
    className,
    classFICount: 1,
    classesCompositeFi: [compositeFI],
    hasIntegrated: false
  };
}

function hasCalculatedFIForClass(indexClass) {
  return indexClass != null && indexClass >= 0;
}
