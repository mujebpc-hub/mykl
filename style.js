const photos = [

    {
        file: "IMG-20260930-WA0008.jpg",
        title: "Study Notes 01",
        subject: "Study Material"
    },

    {
        file: "IMG-20260930-WA0009.jpg",
        title: "Study Notes 02",
        subject: "Study Material"
    },

    {
        file: "IMG-20260930-WA0010.jpg",
        title: "Study Notes 03",
        subject: "Study Material"
    }

];


const gallery = document.getElementById("gallery");
const photoCount = document.getElementById("photoCount");


function showPhotos() {

    gallery.innerHTML = "";

    photos.forEach(photo => {

        const card = document.createElement("div");

        card.className = "photo-card";

        card.innerHTML = `
            <img
                src="image/${photo.file}"
                alt="${photo.title}"
                loading="lazy"
            >

            <div class="photo-info">
                <h3>${photo.title}</h3>
                <p>${photo.subject}</p>
            </div>
        `;

        card.addEventListener("click", () => {
            window.open(`image/${photo.file}`, "_blank");
        });

        gallery.appendChild(card);

    });

    photoCount.textContent = `${photos.length} Photos`;

}


showPhotos();
