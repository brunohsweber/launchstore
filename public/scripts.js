const Mask = {
  apply(input, func) {
    setTimeout(() => {
      input.value = Mask[func](input.value);
    }, 0);
  },
  formatBRL(value) {
    value = value.replace(/\D/g, "");

    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value / 100);
  },
  formatPercent(value) {
    value = value.replace(/\D/g, "");

    value = value * 0.01;

    return new Intl.NumberFormat("pt-BR", {
      style: "percent",
      minimumFractionDigits: 2,
      maximumFractionDigits: 4,
    }).format(value * 0.01);
  },
  formatCPF(value) {
    value = value.replace(/\D/g, "");

    return value.replace(/^(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
  },
  cpfCnpj(value) {
    value = value.replace(/\D/g, "");

    if (value.length > 14) {
      value = value.slice(0, -1);
    }

    // check if is cpf or cnpj
    if (value.length > 11) {
      // cnpj 11222333444455

      // 11.222333444455
      value = value.replace(/(\d{2})(\d)/, "$1.$2");

      // 11.222.333444455
      value = value.replace(/(\d{3})(\d)/, "$1.$2");

      // 11.222.333/444455
      value = value.replace(/(\d{3})(\d)/, "$1/$2");

      // 11.222.333/4444-55
      value = value.replace(/(\d{4})(\d)/, "$1-$2");
    } else {
      // cpf 01234567890

      // 012.34567890
      value = value.replace(/(\d{3})(\d)/, "$1.$2");

      // 012.345.67890
      value = value.replace(/(\d{3})(\d)/, "$1.$2");

      // 012.345.678-90
      value = value.replace(/(\d{3})(\d)/, "$1-$2");
    }

    return value;
  },
  cep(value) {
    value = value.replace(/\D/g, "");

    if (value.length > 8) {
      value = value.slice(0, -1);
    }

    value = value.replace(/(\d{5})(\d)/, "$1-$2");

    return value;
  },
};

const Validate = {
  apply(input, func) {
    Validate.clearErrors(input);

    let results = Validate[func](input.value);
    input.value = results.value;

    if (results.error) Validate.displayError(input, results.error);
  },
  displayError(input, error) {
    const div = document.createElement("div");

    div.classList.add("error");
    div.innerHTML = error;

    input.parentNode.appendChild(div);
    input.focus();
  },
  clearErrors(input) {
    const errorDiv = input.parentNode.querySelector(".error");

    if (errorDiv) errorDiv.remove();
  },
  isEmail(value) {
    let error = null;

    const mailFormat = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;

    if (!value.match(mailFormat)) error = "Email inválido";

    return {
      error,
      value,
    };
  },
  isCpfCnpj(value) {
    let error = null;

    const cleanValues = value.replace(/\D/g, "");

    if (cleanValues.length > 11 && cleanValues.length !== 14) {
      error = "CNPJ incorreto";
    } else if (cleanValues.length < 12 && cleanValues.length !== 11) {
      error = "CPF incorreto";
    }

    return {
      error,
      value,
    };
  },
  isCep(value) {
    let error = null;

    const cleanValues = value.replace(/\D/g, "");

    if (cleanValues.length !== 8) {
      error = "CEP incorreto";
    }

    return {
      error,
      value,
    };
  },
};

const PhotosUpload = {
  input: "",
  preview: document.querySelector("#photos-preview"),
  uploadLimit: 6,
  files: [],
  handleFileInput(event) {
    const { files: fileList } = event.target;
    PhotosUpload.input = event.target;

    if (PhotosUpload.hasLimit(event)) return;

    Array.from(fileList).forEach((file) => {
      PhotosUpload.files.push(file);

      const reader = new FileReader();

      reader.onload = () => {
        const image = new Image();
        image.src = String(reader.result);

        const div = PhotosUpload.getContainer(image);
        PhotosUpload.preview.appendChild(div);
      };

      reader.readAsDataURL(file);
    });

    PhotosUpload.input.files = PhotosUpload.getAllFiles();
  },
  hasLimit(event) {
    const { uploadLimit, input, preview } = PhotosUpload;

    const { files: fileList } = input;

    if (fileList.length > uploadLimit) {
      alert(`Envie no máximo ${uploadLimit} fotos`);
      event.preventDefault();
      return true;
    }

    const photosDiv = [];

    preview.childNodes.forEach((item) => {
      if (item.classList && item.classList.value == "photo")
        photosDiv.push(item);
    });

    const totalPhotos = fileList.length + photosDiv.length;

    if (totalPhotos > uploadLimit) {
      alert("Você atingiu o limite máximo de fotos");
      event.preventDefault();
      return true;
    }

    return false;
  },
  getAllFiles() {
    const dataTransfer =
      new ClipboardEvent("").clipboardData || new DataTransfer();

    PhotosUpload.files.forEach((file) => dataTransfer.items.add(file));

    return dataTransfer.files;
  },
  getContainer(image) {
    const div = document.createElement("div");

    div.classList.add("photo");

    div.onclick = PhotosUpload.removePhoto;

    div.appendChild(image);

    div.appendChild(PhotosUpload.getRemoveButton());

    return div;
  },
  getRemoveButton() {
    const button = document.createElement("i");

    button.classList.add("material-icons");
    button.innerHTML = "close";

    return button;
  },
  removePhoto(event) {
    const photoDiv = event.target.parentNode; // <div class="photo">
    const photosArray = Array.from(PhotosUpload.preview.children);
    const index = photosArray.indexOf(photoDiv);

    PhotosUpload.files.splice(index, 1);
    PhotosUpload.input.files = PhotosUpload.getAllFiles();

    photoDiv.remove();
  },
  removeOldPhoto(event) {
    const photoDiv = event.target.parentNode;

    if (photoDiv.id) {
      const removedFiles = document.querySelector(
        'input[name="removed_files"]'
      );

      if (removedFiles) {
        removedFiles.value += `${photoDiv.id},`;
      }
    }

    photoDiv.remove();
  },
};

const ImageGallery = {
  highlight: document.querySelector(".gallery .highlight > img"),
  previews: document.querySelectorAll(".gallery-preview img"),
  setImage(event) {
    const { target } = event;

    ImageGallery.previews.forEach((preview) =>
      preview.classList.remove("active")
    );

    target.classList.add("active");

    ImageGallery.highlight.src = target.src;
    Lightbox.image.src = target.src;
  },
};

const Lightbox = {
  target: document.querySelector(".lightbox-target"),
  image: document.querySelector(".lightbox-target img"),
  closeButton: document.querySelector(".lightbox-target a.lightbox-close"),
  open() {
    Lightbox.target.style.opacity = 1;
    Lightbox.target.style.top = 0;
    Lightbox.target.style.button = 0;
    Lightbox.closeButton.style.top = 0;
  },
  close() {
    Lightbox.target.style.opacity = 0;
    Lightbox.target.style.top = "-100%";
    Lightbox.target.style.button = "initial";
    Lightbox.closeButton.style.top = "-80px";
  },
};
