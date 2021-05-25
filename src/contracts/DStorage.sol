pragma solidity ^0.5.0;

contract DStorage {
    string public name = "DStorage";
    uint256 public fileCount = 0;
    mapping(uint256 => File) public files;
    struct File {
        uint256 fileId;
        string fileHash;
        uint256 fileSize;
        string fileType;
        string fileName;
        string fileDescription;
        address payable uploader;
    }

    event FileUploaded(
        uint256 fileId,
        string fileHash,
        uint256 fileSize,
        string fileType,
        string fileName,
        string fileDescription,
        address payable uploader
    );

    constructor() public {}

    function uploadFile(
        string memory _hash,
        uint256 _size,
        string memory _type,
        string memory _name,
        string memory _description
    ) public {
        require(bytes(_hash).length > 0);
        require(bytes(_type).length > 0);
        require(bytes(_description).length > 0);
        require(bytes(_name).length > 0);
        require(msg.sender != address(0));
        require(_size > 0);
        fileCount++;
        files[fileCount] = File(
            fileCount,
            _hash,
            _size,
            _type,
            _name,
            _description,
            msg.sender
        );
        emit FileUploaded(
            fileCount,
            _hash,
            _size,
            _type,
            _name,
            _description,
            msg.sender
        );
    }
}
