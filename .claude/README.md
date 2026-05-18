# 🎯 Claude Code Setup - Sankhya Compliance

Bem-vindo! Aqui está como usar seu setup customizado de **Agents, Prompts e Skills**.

---

## 🚀 Quick Start

### Opção 1: Fluxo Completo (Recomendado)
```bash
/estella [Sua demanda fiscal]
```
Exemplo:
```bash
/estella Reforma Tributária IBS/CBS - suporte a cálculos dinâmicos
```
→ Vai fazer ritual de abertura + gerar Épico → Feature → Atividade (com pausas para aprovação)

### Opção 2: Artefato Isolado
```bash
/epic [Contexto do Épico]
/feature [Contexto da Feature]
/activity [Contexto da Atividade]
```

---

## 📁 Estrutura

```
.claude/
├── README.md                          ← Você está aqui
├── ORGANIZACAO.md                     ← Visão geral da estrutura
├── SKILLS-SETUP.md                    ← Como usar os /comandos
│
├── agents/
│   ├── Estella - Product Owner.agent.md          ⭐ Agent principal
│   ├── Fiscal NT Analyst - Analista de Impacto de NT.agent.md
│   ├── Marc - Gerador de md.agent.md
│   └── ... outros agentes
│
├── prompts/
│   ├── PROMPTS-README.md              ← Guia de templates
│   └── estella/                       ← Pasta organizada
│       ├── epico.prompt.md
│       ├── feature.prompt.md
│       └── activity.prompt.md
│
└── skills/                            ← Slash commands
    ├── estella.md
    ├── estella-epic.md
    ├── estella-feature.md
    └── estella-activity.md
```

---

## 🎯 Use Cases

### 📊 Criar Épico (Stakeholders)
```bash
/epic Reforma Tributária - suporte a IBS/CBS
```
→ Template em `.claude/prompts/estella/epico.prompt.md`

### 🔧 Quebrar em Features (Arquiteto)
```bash
/feature Implementar tpOper/tpEnteGov no DPS
```
→ Template em `.claude/prompts/estella/feature.prompt.md`

### 💻 Gerar Atividades (Dev)
```bash
/activity Alterar GeradorXmlSankhyaNFSe para tpOper
```
→ Template em `.claude/prompts/estella/activity.prompt.md`

---

## 📖 Documentação

| Arquivo | Propósito |
|---------|-----------|
| `ORGANIZACAO.md` | Visão geral de agents → prompts → skills |
| `SKILLS-SETUP.md` | Como usar os `/comandos` |
| `prompts/PROMPTS-README.md` | Detalhe de cada template |
| `agents/Estella - PO.agent.md` | Agente que orquestra tudo |

---

## ✨ Fluxo de Trabalho Ideal

```
1. PM inicia demanda
   ↓
2. /estella [contexto]
   ↓
3. Estella pergunta PM + Arquiteto
   ↓
4. NÍVEL 1: Épico (negócio)
   ↓ [PAUSA - Aprova PM?]
   ↓
5. NÍVEL 2: Feature (arquitetura)
   ↓ [PAUSA - Aprova Arquiteto?]
   ↓
6. NÍVEL 3: Atividade (implementação)
   ↓
7. Dev pega atividade para sprint
```

---

## 🎓 Dicas

### ✅ Bom Usar
- `/estella` para demandas **complexas/novas**
- `/epic` quando já tem contexto claro
- Manter PM + Arquiteto no loop durante quebra

### ❌ Evitar
- Usar `/estella` para tarefas triviais (use `/activity` direto)
- Pular aprovações (o processo é importante)
- Mudar templates sem testar

---

## 🔧 Manutenção

### Atualizar Templates
1. Edite `.claude/prompts/estella/*.prompt.md`
2. Próxima vez que usar `/estella`, já usa a nova versão
3. Sem precisa reiniciar nada!

### Adicionar Novo Skill
1. Crie arquivo em `.claude/skills/seu-skill.md`
2. Digite `/` na entrada
3. Seu novo skill aparece na lista

---

## 🚀 Próximas Melhorias

- [ ] Skills integrarem direto com Agentes
- [ ] Add skills para Marc, Fiscal NT Analyst
- [ ] Criar alias customizados
- [ ] Documentar no GitBook/Wiki do projeto

---

## 📞 Suporte

- **Estrutura não funcionando?** → Ver `ORGANIZACAO.md`
- **Slash commands não aparecem?** → Ver `SKILLS-SETUP.md`
- **Como usar prompts?** → Ver `prompts/PROMPTS-README.md`
- **Como usar agente?** → Ver `agents/Estella - PO.agent.md`

---

**Status:** ✅ Setup completo e pronto para usar (2026-05-12)  
**Próximo:** Teste com uma demanda real!
