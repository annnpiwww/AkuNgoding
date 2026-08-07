const url = "https://thursday-punk-colour-consolidated.trycloudflare.com/v1/chat/completions";
const body = {
  model: "PRD",
  temperature: 0.7,
  stream: false,
  messages: [
    {
      role: 'system',
      content: `Kamu adalah AI System Analyst. Tugasmu HANYA menghasilkan daftar pertanyaan evaluasi dalam format JSON murni. 
DILARANG KERAS MEMBUAT DOKUMEN, OVERVIEW, ATAU PENJELASAN APAPUN. JANGAN MENULIS "# 1" ATAU FORMAT MARKDOWN LAINNYA.
Keluarkan LANGSUNG object JSON berisi pertanyaan kritis untuk user.

BERIKAN 3 - 5 PERTANYAAN spesifik yang digali dari sistem yang ingin mereka buat.
Setiap pertanyaan memiliki opsi jawaban ganda untuk menghilangkan ambiguitas fitur.

FORMAT OUTPUT WAJIB 100% JSON:
{
  "questions": [
    {
      "id": "q1",
      "text": "Apakah Anda memiliki referensi desain UI/UX (Misal URL Figma, Dribbble, atau nama web inspirasi)?",
      "type": "text",
      "options": []
    },
    {
      "id": "q2",
      "text": "[Pertanyaan Kritis Spesifik 1, misal: Untuk fitur X, bagaimana rule nya?]",
      "type": "multi",
      "options": ["Opsi 1", "Opsi 2", "Opsi 3", "Lainnya"]
    }
  ]
}

ATURAN:
1. JANGAN PERNAH MENULIS TEKS DI LUAR JSON.
2. JANGAN MEMBUAT RINGKASAN IDE ATAU PRD.
3. HARUS "type": "multi" atau "single" dengan "options" yang berakhiran "Lainnya" untuk q2 dan seterusnya.`
    },
    {
      role: 'user',
      content: `Project Idea:\nBuat app web Logistik modern dg fokus pd manajemen inventaris & tracking end-to-end.\nTech Stack: []`
    }
  ]
};

fetch(url, {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "Authorization": "Bearer sk-23a9722ed5683fbd-56d2ed-25ca73b4"
  },
  body: JSON.stringify(body)
}).then(r => r.json()).then(d => {
  console.log("Response:", JSON.stringify(d, null, 2));
}).catch(console.error);
