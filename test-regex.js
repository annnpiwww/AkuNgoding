const content = `Tentu, berikut adalah pertanyaannya:
{
  "questions": [
    { "id": "1" }
  ]
}
Semoga bermanfaat!`;
const jsonMatch = content.match(/\{[\s\S]*\}/);
if (jsonMatch) {
  console.log(jsonMatch[0]);
}
